import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import PatientForm from "./PatientForm";
import PatientTreatments from "./PatientTreatments";
import ConfirmationModal from "./ConfirmationModal";
import { FaPlus, FaEdit, FaTrash, FaMedkit } from "react-icons/fa";


const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientForTreatments, setSelectedPatientForTreatments] = useState<Patient | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | null;
    payload: Patient | null;
  }>({ type: null, payload: null });

  const fetchPatients = useCallback(async () => {
    if (selectedPatientForTreatments) return;
    
    try {
      const response = await window.electronAPI.getAllPatients();
      if (response.success && Array.isArray(response.patients)) {
        const patientsWithDefaults = response.patients.map((patient: any) => ({
          ...patient,
          date: patient.date || new Date().toISOString(),
          treatments: patient.treatments || [],
        }));
        setPatients(patientsWithDefaults);
        setFilteredPatients(patientsWithDefaults);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, [selectedPatientForTreatments]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    setFilteredPatients(
      patients.filter((patient) => {
        if (searchField === "all") {
          return Object.values(patient).some((value) =>
            String(value).toLowerCase().includes(lowercasedSearchTerm)
          );
        }
        return String(patient[searchField as keyof Patient])
          .toLowerCase()
          .includes(lowercasedSearchTerm);
      })
    );
  }, [patients, searchTerm, searchField]);

  const handleSubmit = async (patientData: PatientCreateData) => {
    try {
      if (editingPatient) {
        const result = await window.electronAPI.updatePatient(editingPatient.id, patientData);
        if (result.success) {
          await fetchPatients();
          setShowForm(false);
          setEditingPatient(null);
        }
      } else {
        const result = await window.electronAPI.addPatient(patientData);
        if (result.success) {
          await fetchPatients();
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Error handling patient submission:', error);
    }
  };

  const handleCancelAction = () => {
    setConfirmAction({ type: null, payload: null });
    setEditingPatient(null);
    setShowForm(false);
  };

  const handleConfirmAction = async () => {
    if (confirmAction.type === "delete" && confirmAction.payload) {
      try {
        await window.electronAPI.deletePatient(confirmAction.payload.id);
        await fetchPatients();
      } catch (error) {
        console.error("Error deleting patient:", error);
      }
    }
    setConfirmAction({ type: null, payload: null });
  };

  // const refreshPatientTreatments = async (patientId: number) => {
  //   try {
  //     const patientResponse = await window.electronAPI.getPatientTreatments(patientId);
  //     if (patientResponse.success) {
  //       const mappedTreatments: Treatment[] = patientResponse.treatments.map(t => ({
  //         id: t.id,
  //         name: t.name,
  //         description: t.description,
  //         date: t.date,
  //         price: t.price,
  //         patientId: t.patient_id,
  //         paymentHistory: t.payments?.map(p => ({
  //           id: p.id,
  //           paid: p.paid,
  //           date: p.date,
  //           act: p.act,
  //           treatment_id: t.id
  //         })) || []
  //       }));
        
  //       if (selectedPatientForTreatments) {
  //         setSelectedPatientForTreatments({
  //           ...selectedPatientForTreatments,
  //           treatments: mappedTreatments
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error refreshing treatments:", error);
  //   }
  // };

  const handleAddTreatment = async (treatmentData: Omit<TreatmentFormData, 'patientId'> & { patientId: number }) => {
    try {
      const response = await window.electronAPI.addTreatment(treatmentData);
      if (response.success && selectedPatientForTreatments) {
        const patientResponse = await window.electronAPI.getPatientTreatments(selectedPatientForTreatments.id);
        if (patientResponse.success) {
          const mappedTreatments = mapAPITreatmentsToTreatments(patientResponse.treatments);
          setSelectedPatientForTreatments(prev => ({
            ...prev!,
            treatments: mappedTreatments
          }));
        }
      }
    } catch (error) {
      console.error("Error adding treatment:", error);
    }
  };

  const mapAPITreatmentsToTreatments = (apiTreatments: any[]): Treatment[] => {
    return apiTreatments.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      date: t.date,
      price: t.price,
      patientId: t.patient_id,
      paymentHistory: t.payments?.map((p: any) => ({
        id: p.id,
        paid: p.paid,
        date: p.date,
        act: p.act,
        treatment_id: t.id
      })) || []
    }));
  };

  const handleUpdateTreatment = async (treatmentId: number, treatmentData: Partial<Treatment>) => {
    try {
      const response = await window.electronAPI.updateTreatment(treatmentId, treatmentData);
      if (response.success && selectedPatientForTreatments) {
        const patientResponse = await window.electronAPI.getPatientTreatments(selectedPatientForTreatments.id);
        if (patientResponse.success) {
          const mappedTreatments = mapAPITreatmentsToTreatments(patientResponse.treatments);
          setSelectedPatientForTreatments(prev => ({
            ...prev!,
            treatments: mappedTreatments
          }));
        }
      }
    } catch (error) {
      console.error("Error updating treatment:", error);
    }
  };

  const handleDeleteTreatment = async (treatmentId: number) => {
    try {
      const response = await window.electronAPI.deleteTreatment(treatmentId);
      if (response.success && selectedPatientForTreatments) {
        const patientResponse = await window.electronAPI.getPatientTreatments(selectedPatientForTreatments.id);
        if (patientResponse.success) {
          const mappedTreatments = mapAPITreatmentsToTreatments(patientResponse.treatments);
          setSelectedPatientForTreatments(prev => ({
            ...prev!,
            treatments: mappedTreatments
          }));
        }
      }
    } catch (error) {
      console.error("Error deleting treatment:", error);
    }
  };

  if (selectedPatientForTreatments) {
    return (
      <PatientTreatments
        key={selectedPatientForTreatments.id}
        patient={selectedPatientForTreatments}
        onBack={() => setSelectedPatientForTreatments(null)}
        onAddTreatment={handleAddTreatment}
        onUpdateTreatment={handleUpdateTreatment}
        onDeleteTreatment={handleDeleteTreatment}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-beige">
      <Sidebar />
      <div className="flex-1 p-6 bg-beige">
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mb-6">
          <button
            className="flex items-center justify-center py-2 px-4 w-full sm:w-36 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => {
              setEditingPatient(null);
              setShowForm(true);
            }}
          >
            <FaPlus className="mr-2" /> Add Patient
          </button>
          <select
            title="Filter"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="w-full sm:w-40 px-4 py-2 bg-white border rounded-md text-sm shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="all">All Fields</option>
            <option value="name">Name</option>
            <option value="last_name">Last Name</option>
            <option value="age">Age</option>
            <option value="date">Date</option>
            <option value="case_description">Case Description</option>
          </select>
          <input
            type="text"
            className="w-full sm:w-80 h-11 px-4 pl-12 text-sm text-gray-700 bg-white border rounded-full focus:ring-2 focus:ring-green-500 focus:outline-none shadow-md"
            placeholder="Search for patient"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600">Last Name</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600">Age</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600">Case</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-700">{patient.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{patient.last_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{patient.age}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{patient.date}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{patient.case_description}</td>
                  <td className="px-5 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          setEditingPatient(patient);
                          setShowForm(true);
                        }}
                        title="Edit patient"
                      >
                        <FaEdit className="mr-1" /> 
                      </button>
                      <button
                        onClick={() => setSelectedPatientForTreatments(patient)}
                        className="text-green-600 hover:text-green-800"
                        title="View treatments"
                      >
                        <FaMedkit className="inline mr-1" /> Treatments
                      </button>
                      <button
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setConfirmAction({ type: "delete", payload: patient })}
                        title="Delete patient"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <PatientForm
          patient={editingPatient ? {
            name: editingPatient.name,
            last_name: editingPatient.last_name,
            age: editingPatient.age || 0,
            date: editingPatient.date,
            case_description: editingPatient.case_description
          } : undefined}
          onCancel={handleCancelAction}
          onSubmit={handleSubmit}
        />
      )}
      {confirmAction.type && confirmAction.payload && (
        <ConfirmationModal
          actionType="delete"
          onCancel={handleCancelAction}
          onConfirm={handleConfirmAction}
          message={`Are you sure you want to delete ${confirmAction.payload.name}?`}
        />
      )}
    </div>
  );
};

export default Patients;
