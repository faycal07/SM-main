const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./db.js');
const auth = require('./auth');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'smicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

ipcMain.handle('register-user', async (event, userData) => {
  try {
    const result = await auth.registerUser(userData);
    return result;
  } catch (error) {
    console.error('Error during registration:', error);
    return { success: false, message: 'Registration failed due to server error' };
  }
});

ipcMain.handle('authenticate-user', async (event, credentials) => {
  try {
    const result = await auth.authenticateUser(credentials);
    return result;
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
});

ipcMain.handle('verify-token', async (event, token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { success: true, username: decoded.username };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      return { success: false, message: 'Token expired' };
    }
    return { success: false, message: 'Invalid token' };
  }
});

ipcMain.handle('getUserInfo', async (event, token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const username = decoded.username;

    if (!username) {
      return { success: false, message: 'Invalid token: Username missing' };
    }

    const user = await db.getUserByUsername(username);
    if (user) {
      return { success: true, name: user.name };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    console.error('Error in getUserInfo:', error.message);
    return { success: false, message: 'Invalid token' };
  }
});

// Patient Management
ipcMain.handle('get-all-patients', async () => {
  try {
    const patients = await db.getAllPatients();
    return { success: true, patients };
  } catch (error) {
    console.error('Error getting patients:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-patient', async (event, patientData) => {
  try {
    const result = await db.addPatient(patientData);
    return { success: true, patientId: result.patientId };
  } catch (error) {
    console.error('Error adding patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updatePatient', async (_, id, patient) => {
  try {
    await db.run(
      'UPDATE patients SET name = ?, last_name = ?, age = ?, case_description = ?, date = ? WHERE id = ?',
      [patient.name, patient.last_name, patient.age, patient.case_description, patient.date, id]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating patient:', error);
    return { success: false };
  }
});

ipcMain.handle('delete-patient', async (event, id) => {
  try {
    await db.deletePatient(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting patient:', error);
    return { success: false, error: error.message };
  }
});

// Treatment Management
ipcMain.handle('add-treatment', async (event, treatmentData) => {
  try {
    const result = await db.addTreatment(treatmentData);
    return { success: true, treatmentId: result.treatmentId };
  } catch (error) {
    console.error('Error adding treatment:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-treatment', async (event, { id, treatmentData }) => {
  try {
    await db.updateTreatment(id, treatmentData);
    return { success: true };
  } catch (error) {
    console.error('Error updating treatment:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deleteTreatment', async (event, id) => {
  console.log('Attempting to delete treatment with id:', id);
  try {
    await db.deleteTreatment(id);
    console.log('Treatment deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting treatment:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('getPatientTreatments', async (_, patientId) => {
  try {
    const treatments = await db.getPatientTreatments(patientId);
    console.log('Treatments from DB:', treatments);

    return { success: true, treatments: treatments.treatments || [] }; // Flatten if nested
  } catch (error) {
    console.error('Error in getPatientTreatments handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-payment', async (event, paymentData) => {
  try {
    const result = await db.addPayment(paymentData); // Backend DB operation
    return { success: true, paymentId: result.paymentId }; // Respond with success and new payment ID
  } catch (error) {
    console.error('Error adding payment:', error.message); // Log the error message
    if (error.code === 'SQLITE_CONSTRAINT') {
      return { success: false, error: 'Foreign key constraint failed. Please ensure the treatment ID is valid.' };
    }
    return { success: false, error: error.message }; // Respond with error
  }
});

ipcMain.handle('get-treatment-payments', async (event, treatmentId) => {
  try {
    const query = `
      SELECT id, paid, date, act, treatment_id 
      FROM payments 
      WHERE treatment_id = ?
    `;
    const payments = await new Promise((resolve, reject) => {
      db.all(query, [treatmentId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    return { success: true, payments };
  } catch (error) {
    console.error('Error fetching treatment payments:', error);
    return { success: false, error: error.message };
  }
});

// ipcMain.handle('delete-payment', async (_, id) => {
//   try {
//     await db.run('DELETE FROM payments WHERE id = ?', [id]);
//     return { success: true };
//   } catch (error) {
//     console.error('Error deleting payment:', error);
//     return { success: false, error: error.message };
//   }
// });

ipcMain.handle('update-payment', async (event, { id, paymentData }) => {
  try {
    await db.updatePaymentHistory(id, paymentData);
    return { success: true };
  } catch (error) {
    console.error('Error updating payment:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-payment', async (event, id) => {
  console.log('Attempting to delete Payment with id:', id);
  try {
    await db.deletePayment(id);
    console.log('Payment deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting payment:', error);
    return { success: false, error: error.message };
  }
});
