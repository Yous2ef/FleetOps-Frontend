const summaryData = [
    { selector: ".active-routes",  count: "24",      change: "+2.1%", positive: true  },
    { selector: ".orders-today",   count: "140",     change: "+14%",  positive: true  },
    { selector: ".open-alerts",    count: "4",       change: "N/A",   positive: null  },
    { selector: ".fuel-efficency", count: "8.2 km/L",change: "-4%",   positive: false },
    { selector: ".delivery-rate",  count: "50%",     change: "-2%",   positive: false  },
];
 
const fleetData = [
    { routeId: "RT-0041", location: "Nasr City → Heliopolis",    driver: "Omar Farouk",     progress: 72, eta: "14:45" },
    { routeId: "RT-0042", location: "Dokki → Mohandessin",       driver: "Samira Hamed",   progress: 35, eta: "15:10" },
    { routeId: "RT-0043", location: "Maadi → New Cairo",         driver: "Tarek Soliman",  progress: 88, eta: "14:30" },
    { routeId: "RT-0044", location: "Zamalek → Garden City",     driver: "Nadia Youssef",  progress: 51, eta: "15:25" },
    { routeId: "RT-0045", location: "6th October → Giza",        driver: "Hassan Adel",    progress: 19, eta: "16:05" },
    { routeId: "RT-0046", location: "Shubra → Rod El Farag",     driver: "Mona Karim",     progress: 64, eta: "14:55" },
    { routeId: "RT-0047", location: "Helwan → Maadi",            driver: "Khaled Mansour", progress: 90, eta: "14:22" },
    { routeId: "RT-0048", location: "Ain Shams → Abbassia",      driver: "Dalia Ibrahim",  progress: 42, eta: "15:40" },
    { routeId: "RT-0049", location: "Shorouk → New Cairo",       driver: "Youssef Nasser", progress: 78, eta: "14:50" },
    { routeId: "RT-0050", location: "Obour → 10th Ramadan",      driver: "Rania Selim",    progress: 55, eta: "15:15" },
    { routeId: "RT-0051", location: "Portsaid → Ismailia",       driver: "Ahmed Badawi",   progress: 30, eta: "16:30" },
    { routeId: "RT-0052", location: "Alexandria → Cairo Ring",   driver: "Sara Mostafa",   progress: 67, eta: "15:00" },
];
 
const alertsData = [
    { type: "SUDDEN DECELERATION", time: "14:22", severity: "critical", message: "V-788293 detected sudden G-force spike on Route A4." },
    { type: "ENGINE OVERHEAT",     time: "13:58", severity: "critical", message: "V-441120 coolant temperature exceeded threshold on Route B2." },
    { type: "IDLE TIME EXCEEDED",  time: "13:31", severity: "warning",  message: "V-556673 idling for 22 minutes at Nasr City depot." },
];
 
const violationsData = [
    { type: "ETA MISSED",          time: "12:30", severity: "warning", message: "ORD-88219 +45M delayed — Northside Distribution Center." },
    { type: "DELIVERY WINDOW",     time: "11:15", severity: "warning", message: "ORD-77142 arrived 30M outside agreed customer window." },
];

export {summaryData, fleetData, alertsData, violationsData};