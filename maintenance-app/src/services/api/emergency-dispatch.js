import emergencyDispatchData from "../storage/emergency-dispatch.js";
import api from "/shared/api-handler.js";

api.setBaseURL("http://localhost:3000");

const emergencyDispatchService = {
    getIncidents: () => {
        return Promise.resolve(emergencyDispatchData.incidents);
    },
    
    getMechanics: () => {
        return Promise.resolve(emergencyDispatchData.mechanics);
    },
    
    getIncidentById: (id) => {
        const incident = emergencyDispatchData.incidents.find(inc => inc.id === id);
        return Promise.resolve(incident);
    },
    
    dispatchMechanic: (incidentId, mechanicId) => {
        console.log(`Dispatching mechanic ${mechanicId} to incident ${incidentId}`);
        return Promise.resolve({ success: true });
    }
};

export default emergencyDispatchService;
