export const stallsData = [
  // ROW A
  {
    id: "A1",
    name: "Apex Cyber Security",
    exhibitor: "Apex Defense Systems Group",
    category: "Cybersecurity",
    description: "Next-generation threat intelligence, cloud vulnerability scanning, and zero-trust framework demonstrations.",
    host: "Dr. Sarah Jenkins",
    status: "Active",
    tags: ["Security", "Cloud", "Demo Available"],
    center: { x: 260, y: 190 },
    points: "200,150 320,150 320,230 200,230",
    event: "14:00 - Zero Trust Workshop"
  },
  {
    id: "A2",
    name: "BioGen Research Labs",
    exhibitor: "BioGen Pharma Corp",
    category: "Biotechnology",
    description: "Discover breakthrough CRISPR therapies and computational models for protein folding simulation.",
    host: "Marcus Vance",
    status: "Busy",
    tags: ["Healthcare", "AI", "Research Paper"],
    center: { x: 410, y: 190 },
    points: "350,150 470,150 470,230 350,230",
    event: "15:30 - Future of mRNA Therapies"
  },
  {
    id: "A3",
    name: "Cognitive AI Systems",
    exhibitor: "Cognitive Minds Inc.",
    category: "Artificial Intelligence",
    description: "Multi-modal generative models running locally on edge hardware with high energy efficiency.",
    host: "Elena Rostova",
    status: "Active",
    tags: ["Deep Learning", "Edge Computing"],
    center: { x: 560, y: 190 },
    points: "500,150 620,150 620,230 500,230",
    event: "11:00 - Local AI Deployment Q&A"
  },
  {
    id: "A4",
    name: "Decentralized Web Corp",
    exhibitor: "DWeb Foundation",
    category: "Blockchain / Web3",
    description: "High-throughput layer-1 networks with zero-knowledge proof consensus mechanisms.",
    host: "Satoshi Nakano",
    status: "Active",
    tags: ["Web3", "Cryptographic Proofs"],
    center: { x: 710, y: 190 },
    points: "650,150 770,150 770,230 650,230",
    event: "16:00 - Scaling ZK Rollups"
  },
  // ROW B
  {
    id: "B1",
    name: "EcoCharge Technologies",
    exhibitor: "EcoCharge Global",
    category: "Clean Energy",
    description: "Solid-state battery configurations providing 3x energy density for long-haul commercial EVs.",
    host: "Oliver Sterling",
    status: "Active",
    tags: ["Sustainability", "EV Battery"],
    center: { x: 160, y: 340 },
    points: "100,300 220,300 220,380 100,380",
    event: "13:00 - Solid State Revolution"
  },
  {
    id: "B2",
    name: "Fusion Dynamics",
    exhibitor: "Fusion Lab Systems",
    category: "Clean Energy",
    description: "Compact stellarator designs and superconductive magnet shielding for commercial reactors.",
    host: "Dr. Kenji Tanaka",
    status: "Busy",
    tags: ["Nuclear Fusion", "High Tech"],
    center: { x: 310, y: 340 },
    points: "250,300 370,300 370,380 250,380",
    event: "10:30 - Plasma Diagnostics Demo"
  },
  {
    id: "B3",
    name: "GigaRobotics Corp",
    exhibitor: "Giga Robotics LLC",
    category: "Robotics",
    description: "Humanoid general-purpose robotic agents with autonomous navigation and sub-millimeter dexterity.",
    host: "Chloe Chevalier",
    status: "Active",
    tags: ["Robotics", "Automation", "Live Show"],
    center: { x: 460, y: 340 },
    points: "400,300 520,300 520,380 400,380",
    event: "Every Hour - Humanoid Walkthrough"
  },
  {
    id: "B4",
    name: "Helios Solar Tech",
    exhibitor: "Helios Energy",
    category: "Clean Energy",
    description: "Perovskite-silicon tandem solar cells capturing over 32% efficiency under low-light environments.",
    host: "Ray Higgins",
    status: "Active",
    tags: ["Solar", "Green Tech"],
    center: { x: 610, y: 340 },
    points: "550,300 670,300 670,380 550,380",
    event: "12:00 - Tandem Cells Production Plan"
  },
  // ROW C
  {
    id: "C1",
    name: "Ion Propulsion Systems",
    exhibitor: "IonSpace",
    category: "Aerospace",
    description: "High-impulse Hall thrusters designed for micro-satellite constellation orbit raising and maintenance.",
    host: "Commander Alex Mercer",
    status: "Active",
    tags: ["Space", "Propulsion", "Hardware"],
    center: { x: 160, y: 470 },
    points: "100,430 220,430 220,510 100,510",
    event: "14:45 - Thruster Firing Analysis"
  },
  {
    id: "C2",
    name: "Quantum Computing Lab",
    exhibitor: "Qubit Labs Corp",
    category: "Quantum Computing",
    description: "120-qubit topological quantum processor prototype utilizing Majorana fermions for error correction.",
    host: "Dr. Alice Cooper",
    status: "Busy",
    tags: ["Quantum", "Majorana", "Superconductors"],
    center: { x: 310, y: 470 },
    points: "250,430 370,430 370,510 250,510",
    event: "13:30 - Topological Quantum Gates"
  },
  {
    id: "C3",
    name: "NeuroLink Interfaces",
    exhibitor: "NeuroLink Systems",
    category: "Biotechnology",
    description: "Non-invasive brain-computer interfaces translating high-density EEG to real-time spatial keyboard commands.",
    host: "Sophia Lin",
    status: "Active",
    tags: ["BCI", "Neurotech", "Live Demo"],
    center: { x: 460, y: 470 },
    points: "400,430 520,430 520,510 400,510",
    event: "Every 30 Mins - Spatial Typing Demo"
  },
  // ROW D (Right Vertical Stalls)
  {
    id: "D1",
    name: "OptoPhotonics Inc.",
    exhibitor: "OptoPhotonics",
    category: "Hardware",
    description: "Silicon photonics transceivers routing 1.6 Terabits/sec per fiber channel for hyper-scale AI datacenters.",
    host: "Lucas Thorne",
    status: "Active",
    tags: ["Photonics", "Datacenter", "Hardware"],
    center: { x: 885, y: 185 },
    points: "820,150 950,150 950,220 820,220",
    event: "11:30 - Optoelectronic Integration"
  },
  {
    id: "D2",
    name: "Prism Advanced Displays",
    exhibitor: "Prism Displays",
    category: "Hardware",
    description: "Holographic light-field panels outputting 3D stereoscopic images without eye-wear tracking.",
    host: "David Ross",
    status: "Active",
    tags: ["Optics", "Display", "AR/VR"],
    center: { x: 885, y: 275 },
    points: "820,240 950,240 950,310 820,310",
    event: "15:00 - Light-field Rendering Tech"
  },
  {
    id: "D3",
    name: "Synthetic Genomics",
    exhibitor: "SynGen Systems",
    category: "Biotechnology",
    description: "Designing de-novo synthetic bacterial genomes optimized for efficient carbon sequestration.",
    host: "Elena Rostova",
    status: "Active",
    tags: ["BioTech", "Synthetic Life"],
    center: { x: 885, y: 365 },
    points: "820,330 950,330 950,400 820,400",
    event: "16:30 - Synthetic Carbon Fixation"
  }
];

export const nonStallZones = [
  {
    id: "STAGE",
    name: "Main Keynote Stage",
    category: "Presentation Area",
    description: "The primary venue theater for industry leaders, technical presentations, and panel debates.",
    center: { x: 500, y: 60 },
    points: "350,20 650,20 650,100 350,100"
  },
  {
    id: "FOOD",
    name: "Green Oasis Food Court",
    category: "Refreshments",
    description: "Local artisan vendors, organic beverages, and charging docks for laptops/phones.",
    center: { x: 860, y: 495 },
    points: "750,420 970,420 970,570 750,570"
  },
  {
    id: "RESTROOMS",
    name: "VIP Restrooms",
    category: "Restrooms",
    description: "Sanitized restrooms, clean water fountains, and diaper-changing facilities.",
    center: { x: 90, y: 60 },
    points: "30,20 150,20 150,100 30,100"
  }
];

export const landmarks = [
  { id: "exit-w", type: "exit", label: "Main Exit West", x: 20, y: 300 },
  { id: "exit-e", type: "exit", label: "Main Exit East", x: 980, y: 300 },
  { id: "exit-n", type: "exit", label: "Exit North", x: 500, y: 15 },
  { id: "aid-1", type: "firstaid", label: "First Aid Station A", x: 260, y: 60 },
  { id: "aid-2", type: "firstaid", label: "First Aid Station B", x: 710, y: 340 },
  { id: "wc-1", type: "restroom", label: "Restrooms", x: 90, y: 60 }
];
