import React, { useState, useEffect } from 'react';
import { solveKMap } from './solver';

// --- CONFIGURACIONES VISUALES ---
const CONFIGS = {
    3: { // 8 celdas (2x4) - A \ BC
        rowsGray: [0, 1], rowLabels: ["0", "1"], rowTitle: "A",
        colsGray: [0, 1, 3, 2], colLabels: ["00", "01", "11", "10"], colTitle: "BC",
        gridCols: "grid-cols-[60px_repeat(4,80px)]"
    },
    4: { // 16 celdas (4x4) - AB \ CD
        rowsGray: [0, 1, 3, 2], rowLabels: ["00", "01", "11", "10"], rowTitle: "AB",
        colsGray: [0, 1, 3, 2], colLabels: ["00", "01", "11", "10"], colTitle: "CD",
        gridCols: "grid-cols-[60px_repeat(4,80px)]"
    },
    5: { // 32 celdas (8x4) - ABC \ DE
        rowsGray: [0, 1, 3, 2, 6, 7, 5, 4], rowLabels: ["000", "001", "011", "010", "110", "111", "101", "100"], rowTitle: "ABC",
        colsGray: [0, 1, 3, 2], colLabels: ["00", "01", "11", "10"], colTitle: "DE",
        gridCols: "grid-cols-[60px_repeat(4,80px)]"
    }
};

const CHAR_MAP = {
    '0': [1,1,1,1,1,1,0], '1': [0,1,1,0,0,0,0], '2': [1,1,0,1,1,0,1], '3': [1,1,1,1,0,0,1],
    '4': [0,1,1,0,0,1,1], '5': [1,0,1,1,0,1,1], '6': [1,0,1,1,1,1,1], '7': [1,1,1,0,0,0,0],
    '8': [1,1,1,1,1,1,1], '9': [1,1,1,1,0,1,1],
    'A': [1,1,1,0,1,1,1], 'a': [1,1,1,1,1,0,1], 'b': [0,0,1,1,1,1,1], 'B': [1,1,1,1,1,1,1],
    'C': [1,0,0,1,1,1,0], 'c': [0,0,0,1,1,0,1], 'd': [0,1,1,1,1,0,1], 'D': [1,1,1,1,1,1,0],
    'E': [1,0,0,1,1,1,1], 'F': [1,0,0,0,1,1,1], 'H': [0,1,1,0,1,1,1], 'h': [0,0,1,0,1,1,1],
    'L': [0,0,0,1,1,1,0], 'P': [1,1,0,0,1,1,1], 'U': [0,1,1,1,1,1,0], 'u': [0,0,1,1,1,0,0],
    'o': [0,0,1,1,1,0,1], '-': [0,0,0,0,0,0,1], '_': [0,0,0,1,0,0,0], ' ': [0,0,0,0,0,0,0]
};

const EditableDisplay = ({ title, segments, onToggleSegment, pinNames, onRenamePin, color, onQuickInput }) => {
    const [inputValue, setInputValue] = useState("");
    const polys = [
        "10,10 20,0 80,0 90,10 80,20 20,20", "90,10 100,20 100,80 90,90 80,80 80,20", 
        "90,90 100,100 100,160 90,170 80,160 80,100", "10,170 20,160 80,160 90,170 80,180 20,180", 
        "0,90 10,100 10,160 0,170 -10,160 -10,100", "0,10 10,20 10,80 0,90 -10,80 -10,20", 
        "10,90 20,80 80,80 90,90 80,100 20,100"
    ];
    const labelPos = [{x:50,y:-10},{x:115,y:50},{x:115,y:130},{x:50,y:195},{x:-15,y:130},{x:-15,y:50},{x:50,y:90}];
    const onColor = color === 'green' ? "#22c55e" : "#06b6d4";
    const strokeColor = color === 'green' ? "#15803d" : "#0891b2";
    
    const handleKeyDown = (e) => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            onQuickInput(inputValue); 
            setInputValue(""); 
        } 
    };

    return (
        <div className="flex flex-col items-center">
            <span className="text-xs uppercase font-black tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">{title}</span>
            <div className="relative w-32 h-48 bg-slate-900 rounded-lg p-4 border border-slate-700 shadow-inner mb-2">
                <svg viewBox="-30 -30 160 230" className="w-full h-full overflow-visible">
                    {polys.map((points, i) => (
                        <g key={i}>
                            <polygon points={points} fill={segments[i] ? onColor : "#1a1a1a"} stroke={segments[i] ? strokeColor : "#333"} strokeWidth="2" className="cursor-pointer hover:opacity-80" onClick={() => onToggleSegment(i)} />
                            <text x={labelPos[i].x} y={labelPos[i].y} fill="#fbbf24" fontSize="16" fontWeight="bold" textAnchor="middle" className="cursor-pointer hover:fill-white drop-shadow-md" onClick={() => onRenamePin(i)}>{pinNames[i]}</text>
                        </g>
                    ))}
                </svg>
            </div>
            <div className="flex gap-1 w-full max-w-[120px]">
                <input type="text" maxLength="1" placeholder="Escribe..." className="w-full bg-slate-800 border border-slate-600 text-white text-center text-xs py-1 rounded focus:border-cyan-500 outline-none uppercase" value={inputValue} onChange={(e) => setInputValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} />
            </div>
        </div>
    );
};

const HistoryModal = ({ isOpen, onClose, onLoad, currentDb, currentNames, currentVars }) => {
    const [saves, setSaves] = useState([]);
    const [saveName, setSaveName] = useState("");
    useEffect(() => { if (isOpen) { const stored = localStorage.getItem('exam_history_list'); setSaves(stored ? JSON.parse(stored) : []); } }, [isOpen]);
    const handleSave = () => {
        if (!saveName.trim()) return alert("Nombre requerido");
        const newSave = { id: Date.now(), name: saveName, date: new Date().toLocaleString(), db: currentDb, names: currentNames, numVars: currentVars };
        const newSaves = [newSave, ...saves];
        setSaves(newSaves); localStorage.setItem('exam_history_list', JSON.stringify(newSaves)); setSaveName("");
    };
    const handleDelete = (id) => { const newSaves = saves.filter(s => s.id !== id); setSaves(newSaves); localStorage.setItem('exam_history_list', JSON.stringify(newSaves)); };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center"><h2 className="text-lg font-bold text-white">📂 Historial</h2><button onClick={onClose} className="text-slate-400 hover:text-white">✕</button></div>
                <div className="p-4 border-b border-slate-700 bg-slate-800/50"><div className="flex gap-2"><input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Nombre..." className="flex-1 bg-black border border-slate-600 rounded px-3 text-sm text-white" /><button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">Guardar</button></div></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">{saves.length===0?<p className="text-center text-slate-500 text-sm">Vacío</p>:saves.map(s=>(<div key={s.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center"><div><p className="font-bold text-white text-sm">{s.name}</p><p className="text-[10px] text-slate-500">{s.date} - {s.numVars || 5} Vars</p></div><div className="flex gap-2"><button onClick={()=>{onLoad(s.db,s.names,s.numVars);onClose();}} className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded text-xs">Cargar</button><button onClick={()=>handleDelete(s.id)} className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-800 rounded text-xs">Borrar</button></div></div>))}</div>
            </div>
        </div>
    );
};

export default function KMapSolver() {
    // ESTADO
    const [numVars, setNumVars] = useState(() => parseInt(localStorage.getItem('last_session_vars') || "5"));
    const [db, setDb] = useState(() => {
        const last = localStorage.getItem('last_session_db');
        return last ? JSON.parse(last) : Array(32).fill(null).map(() => ({ left: Array(7).fill(0), right: Array(7).fill(0) }));
    });
    const [pinNames, setPinNames] = useState(() => {
        const last = localStorage.getItem('last_session_names');
        return last ? JSON.parse(last) : { left: ['a','b','c','d','e','f','g'], right: ['a','b','c','d','e','f','g'] };
    });

    const [currentCase, setCurrentCase] = useState(0);
    const [selectedItems, setSelectedItems] = useState([{ source: 'left', index: 0 }]); 
    const [activeTabId, setActiveTabId] = useState("left-0"); 
    const [calcMethod, setCalcMethod] = useState('AUTO');
    const [viewMode, setViewMode] = useState('EQUATIONS'); 
    const [multiSolutions, setMultiSolutions] = useState({});
    const [highlightedCells, setHighlightedCells] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // Persistencia
    useEffect(() => { localStorage.setItem('last_session_db', JSON.stringify(db)); }, [db]);
    useEffect(() => { localStorage.setItem('last_session_names', JSON.stringify(pinNames)); }, [pinNames]);
    useEffect(() => { localStorage.setItem('last_session_vars', numVars.toString()); }, [numVars]);

    // Limite de casos según variables
    const maxCases = Math.pow(2, numVars);
    const cfg = CONFIGS[numVars];

    // Cálculo
    useEffect(() => {
        const results = {};
        selectedItems.forEach(item => {
            const id = `${item.source}-${item.index}`;
            const mapValues = db.map(row => row[item.source][item.index]);
            // El Solver sigue recibiendo 1 como ACTIVO. No cambiamos la matemática.
            const sol = solveKMap(mapValues, numVars, calcMethod);
            results[id] = sol;
        });
        setMultiSolutions(results);
        
        if (selectedItems.length > 0 && !selectedItems.some(i => `${i.source}-${i.index}` === activeTabId)) {
            setActiveTabId(`${selectedItems[0].source}-${selectedItems[0].index}`);
        }
    }, [db, selectedItems, calcMethod, numVars]);

    const handleVarChange = (v) => {
        if (window.confirm(`¿Cambiar a ${v} variables? Se reiniciarán los datos.`)) {
            setNumVars(v);
            setDb(Array(32).fill(null).map(() => ({ left: Array(7).fill(0), right: Array(7).fill(0) })));
            setCurrentCase(0);
        }
    };

    const toggleSegment = (side, segIndex) => {
        const newDb = [...db];
        const currentRow = { ...newDb[currentCase] };
        currentRow[side] = [...currentRow[side]];
        currentRow[side][segIndex] = currentRow[side][segIndex] ? 0 : 1;
        newDb[currentCase] = currentRow;
        setDb(newDb);
    };

    const handleQuickInput = (side, char) => {
        const mapping = CHAR_MAP[char];
        if (mapping) {
            const newDb = [...db];
            newDb[currentCase] = { ...newDb[currentCase], [side]: [...mapping] };
            setDb(newDb);
        } else { alert("Caracter no reconocido."); }
    };

    const renamePin = (side, index) => {
        const newName = prompt(`Nuevo nombre:`, pinNames[side][index]);
        if (newName && newName.trim()) setPinNames({...pinNames, [side]: pinNames[side].map((n, i) => i === index ? newName : n)});
    };

    const copyPrevious = () => {
        if (currentCase > 0) {
            const newDb = [...db];
            newDb[currentCase] = JSON.parse(JSON.stringify(newDb[currentCase - 1]));
            setDb(newDb);
        }
    };

    const handleReset = () => {
        if(confirm("¿Limpiar todo?")) {
            setDb(Array(32).fill(null).map(() => ({ left: Array(7).fill(0), right: Array(7).fill(0) })));
            setPinNames({ left: ['a','b','c','d','e','f','g'], right: ['a','b','c','d','e','f','g'] });
        }
    };

    const handleSelection = (source, index) => {
        const id = `${source}-${index}`;
        const exists = selectedItems.find(i => `${i.source}-${i.index}` === id);
        if (exists) { if (selectedItems.length > 1) setSelectedItems(selectedItems.filter(i => `${i.source}-${i.index}` !== id)); }
        else { setSelectedItems([...selectedItems, { source, index }]); setActiveTabId(id); }
    };

    const getRealIndex = (rIndex, cIndex) => {
        const rowGray = cfg.rowsGray[rIndex];
        const colGray = cfg.colsGray[cIndex];
        const colBits = (numVars === 3) ? 2 : (numVars === 4) ? 2 : 2; 
        const rowBits = (numVars === 3) ? 1 : (numVars === 4) ? 2 : 3;
        return (rowGray << colBits) | colGray;
    };

    const activeItem = selectedItems.find(i => `${i.source}-${i.index}` === activeTabId);
    const currentSol = multiSolutions[activeTabId];

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 p-2 font-sans overflow-x-hidden">
            <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} currentDb={db} currentNames={pinNames} currentVars={numVars} 
                onLoad={(lDb, lNames, lVars) => { 
                    setDb(lDb); 
                    setPinNames(lNames); 
                    setNumVars(lVars || 5); 
                }} 
            />

            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4 px-4">
                <div>
                    <h1 className="text-2xl font-bold text-cyan-400">EXAM SUITE <span className="text-white text-sm bg-purple-600 px-2 rounded">v14.4 FINAL</span></h1>
                    <p className="text-xs text-slate-500">DCC (1=ON) | DAC (0=ON) [VISUAL]</p>
                </div>
                
                <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                    {[3, 4, 5].map(v => (
                        <button key={v} onClick={() => v !== numVars && handleVarChange(v)} 
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${numVars === v ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                            {v} VARS
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setShowHistory(true)} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded border border-blue-400 font-bold">📂 HISTORIAL</button>
                    <button onClick={handleReset} className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-900 text-red-200 rounded border border-red-700 font-bold">⚠ RESET</button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 px-4">
                <div className="col-span-12 xl:col-span-4 space-y-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-lg relative">
                        <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-bold border border-slate-700 px-1 rounded">DISEÑO</div>
                        <div className="flex justify-between items-center mb-4 bg-black/20 p-2 rounded">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentCase(c => Math.max(0, c-1))} className="p-1 bg-slate-800 rounded hover:bg-slate-700 text-white">◀</button>
                                <div className="text-center w-16"><span className="text-[10px] text-slate-500 block uppercase">Caso</span><span className="text-2xl font-mono font-bold text-white">{currentCase}</span></div>
                                <button onClick={() => setCurrentCase(c => Math.min(maxCases - 1, c+1))} className="p-1 bg-slate-800 rounded hover:bg-slate-700 text-white">▶</button>
                            </div>
                            <button onClick={copyPrevious} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded text-slate-300 font-bold border border-slate-600">📋 Copiar</button>
                        </div>
                        <div className="flex justify-center gap-4">
                            <EditableDisplay title="DCC (Lógico 1=ON)" segments={db[currentCase].left} onToggleSegment={(i) => toggleSegment('left', i)} pinNames={pinNames.left} onRenamePin={(i) => renamePin('left', i)} color="green" onQuickInput={(char) => handleQuickInput('left', char)} />
                            <div className="w-px bg-slate-800 mx-1"></div>
                            <EditableDisplay title="DAC (Físico 0=ON)" segments={db[currentCase].right} onToggleSegment={(i) => toggleSegment('right', i)} pinNames={pinNames.right} onRenamePin={(i) => renamePin('right', i)} color="cyan" onQuickInput={(char) => handleQuickInput('right', char)} />
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-blue-900/30 relative">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center"><p className="text-[10px] text-green-500 font-bold mb-2 uppercase">DCC</p><div className="flex flex-wrap gap-2 justify-center">{pinNames.left.map((name, idx) => { const isSelected = selectedItems.some(i => i.source === 'left' && i.index === idx); return <button key={`L-${idx}`} onClick={() => handleSelection('left', idx)} className={`w-8 h-8 rounded font-bold text-xs border transition-all ${isSelected ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{name}</button> })}</div></div>
                            <div className="text-center border-l border-slate-800 pl-2"><p className="text-[10px] text-cyan-500 font-bold mb-2 uppercase">DAC</p><div className="flex flex-wrap gap-2 justify-center">{pinNames.right.map((name, idx) => { const isSelected = selectedItems.some(i => i.source === 'right' && i.index === idx); return <button key={`R-${idx}`} onClick={() => handleSelection('right', idx)} className={`w-8 h-8 rounded font-bold text-xs border transition-all ${isSelected ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{name}</button> })}</div></div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-6 xl:col-span-4 flex flex-col items-center">
                    <div className="w-full flex gap-1 overflow-x-auto mb-2 custom-scrollbar pb-1 px-1">{selectedItems.map(item => { const id = `${item.source}-${item.index}`; const isActive = activeTabId === id; const name = pinNames[item.source][item.index]; return <button key={id} onClick={() => setActiveTabId(id)} className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x min-w-[80px] ${isActive ? 'bg-slate-800 text-white border-slate-600 border-b-slate-800 relative z-10' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}><span className={item.source==='left' ? 'text-green-400' : 'text-cyan-400'}>{item.source==='left'?'L':'R'}</span>:{name}</button> })}</div>
                    <div className="w-full bg-slate-800 p-2 rounded-b mb-4 border border-slate-700 flex justify-between items-center text-xs shadow-md">
                        <span className={`${currentSol?.suggestionType === 'sop' ? 'text-green-400' : 'text-red-400'} font-bold`}>{currentSol?.suggestion || "..."}</span>
                        <div className="flex bg-black rounded p-0.5 shrink-0 ml-2"><button onClick={() => setCalcMethod('AUTO')} className={`px-2 py-0.5 rounded ${calcMethod==='AUTO' ? 'bg-slate-600 text-white' : 'text-slate-500'}`}>Auto</button><button onClick={() => setCalcMethod('SOP')} className={`px-2 py-0.5 rounded ${calcMethod==='SOP' ? 'bg-green-700 text-white' : 'text-slate-500'}`}>Min</button><button onClick={() => setCalcMethod('POS')} className={`px-2 py-0.5 rounded ${calcMethod==='POS' ? 'bg-red-700 text-white' : 'text-slate-500'}`}>Max</button></div>
                    </div>
                    <div className={`inline-grid ${cfg.gridCols} gap-1 bg-slate-800 p-2 rounded-lg shadow-2xl border border-slate-700 mb-6`}>
                        <div className="bg-slate-900 flex items-center justify-center font-bold text-[10px] text-slate-500 p-1">{cfg.rowTitle}\{cfg.colTitle}</div>
                        {cfg.colLabels.map((l, i) => <div key={i} className="bg-slate-900 flex items-center justify-center font-bold text-cyan-500 text-xs">{l}</div>)}
                        {cfg.rowLabels.map((l, rIndex) => (
                            <React.Fragment key={rIndex}>
                                <div className="bg-slate-900 flex items-center justify-center font-bold text-yellow-500 text-xs py-2">{l}</div>
                                {cfg.colLabels.map((_, cIndex) => {
                                    const realIndex = getRealIndex(rIndex, cIndex);
                                    let val = 0;
                                    if (activeItem) val = db[realIndex][activeItem.source][activeItem.index];
                                    
                                    const isHighlighted = highlightedCells.includes(realIndex);
                                    const isPOS = currentSol?.activeMethod === 'POS';
                                    
                                    let colorClasses = 'bg-slate-700/50 text-slate-600 border-slate-600/30'; 
                                    if (!isPOS && val === 1) {
                                        colorClasses = 'bg-blue-600 text-white border-blue-400'; 
                                    } else if (isPOS && val === 0) {
                                        colorClasses = 'bg-red-600 text-white border-red-400'; 
                                    }

                                    return <div key={realIndex} className={`h-10 flex items-center justify-center font-bold relative border rounded-sm transition-all ${isHighlighted ? 'ring-2 ring-yellow-400 z-10 scale-110' : ''} ${colorClasses}`}>{val}<span className="absolute top-0 right-0.5 text-[7px] opacity-40">{realIndex}</span></div>
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                    {currentSol?.groupsResult?.length > 0 && (
                        <div className="w-full bg-slate-900/50 p-2 rounded border border-slate-700">
                            <p className="text-[10px] text-slate-500 uppercase mb-1">Visualizar Grupos:</p>
                            <div className="flex flex-col gap-1">
                                {currentSol.groupsResult.map((g, i) => (
                                    <div key={i} onMouseEnter={() => setHighlightedCells(g.cells)} onMouseLeave={() => setHighlightedCells([])} className="flex justify-between items-center px-2 py-1 text-xs font-mono rounded border cursor-help transition-all hover:bg-slate-800 bg-slate-900/50 border-slate-700">
                                        <span className={`font-bold ${g.type.includes('Octeto') ? 'text-purple-400' : 'text-cyan-400'}`}>{g.type}</span>
                                        <span className="text-slate-500 text-[10px] truncate max-w-[80px]">({g.cells.join(',')})</span>
                                        <span className="text-white font-bold">{g.term}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-span-12 md:col-span-6 xl:col-span-4">
                    <div className="bg-slate-900 rounded-lg border border-slate-800 h-[650px] flex flex-col shadow-xl">
                        <div className="flex border-b border-slate-800"><button onClick={() => setViewMode('EQUATIONS')} className={`flex-1 p-3 text-xs font-bold uppercase ${viewMode==='EQUATIONS' ? 'bg-slate-800 text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}>Ecuaciones</button><button onClick={() => setViewMode('TABLE')} className={`flex-1 p-3 text-xs font-bold uppercase ${viewMode==='TABLE' ? 'bg-slate-800 text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}>Tabla Verdad</button></div>
                        <div className="overflow-y-auto flex-1 custom-scrollbar p-3">
                            {viewMode === 'EQUATIONS' && selectedItems.map(item => {
                                const id = `${item.source}-${item.index}`;
                                const sol = multiSolutions[id];
                                const isActive = activeTabId === id;
                                const name = pinNames[item.source][item.index];
                                return (
                                    <div key={id} onClick={() => setActiveTabId(id)} className={`p-3 rounded-lg border cursor-pointer mb-3 transition-all ${isActive ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-slate-600' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                                        <div className="flex justify-between items-center mb-2"><span className={`font-bold text-sm ${item.source==='left' ? 'text-green-400' : 'text-cyan-400'}`}>{item.source==='left'?'DCC':'DAC'} - {name}</span><span className="text-[10px] text-slate-500">{sol?.activeMethod}</span></div>
                                        <div className="mb-2"><p className="text-[9px] text-slate-500 uppercase font-bold">1. F.C.C (Sum/Prod)</p><p className="text-[10px] font-mono text-slate-300 break-words">{sol?.activeMethod==='SOP' ? sol?.fccMinterms : sol?.fccMaxterms}</p></div>
                                        <div className="mb-2"><p className="text-[9px] text-slate-500 uppercase font-bold">1.5. F.C.C (Expandida)</p><p className="text-[10px] font-mono text-cyan-300 break-words max-h-12 overflow-y-auto custom-scrollbar">{sol?.activeMethod==='SOP' ? sol?.fccMintermsExpanded : sol?.fccMaxtermsExpanded}</p></div>
                                        <div className="mb-2"><p className="text-[9px] text-slate-500 uppercase font-bold">2. F.C.A (Larga)</p><div className="text-[10px] font-mono text-slate-300 bg-black/30 p-1 rounded max-h-16 overflow-y-auto custom-scrollbar">{sol?.fcaEquation || "..."}</div></div>
                                        <div><p className="text-[9px] text-green-500 uppercase font-bold">3. Reducida</p><p className="text-sm font-mono text-white font-bold break-words">{sol?.simplifiedEquation}</p></div>
                                    </div>
                                );
                            })}
                            {viewMode === 'TABLE' && (
                                <table className="w-full text-center text-xs font-mono">
                                    <thead className="sticky top-0 bg-slate-900 text-slate-300 shadow-sm z-10">
                                        <tr><th className="py-2">#</th>
                                        {numVars === 3 ? <><th>A</th><th>B</th><th>C</th></> :
                                         numVars === 4 ? <><th>A</th><th>B</th><th>C</th><th>D</th></> :
                                         <><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></>}
                                        {selectedItems.map(item => <th key={`${item.source}-${item.index}`} className={`border-l border-slate-700 ${item.source==='left'?'text-green-400':'text-cyan-400'}`}>{pinNames[item.source][item.index]}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {db.slice(0, maxCases).map((row, idx) => {
                                            const binary = idx.toString(2).padStart(numVars, '0').split('');
                                            return <tr key={idx} className={`border-b border-slate-800/50 hover:bg-slate-800 cursor-pointer ${currentCase === idx ? 'bg-blue-900/30' : ''}`} onClick={() => setCurrentCase(idx)}><td className="py-1 text-slate-600">{idx}</td>{binary.map((b, i) => <td key={i} className={b==='1'?'text-white':'text-slate-600'}>{b}</td>)}{selectedItems.map(item => { 
                                                const rawVal = row[item.source][item.index];
                                                // --- AQUÍ ESTÁ EL TRUCO VISUAL ---
                                                // Si es DAC (right), invertimos lo que se ve (1->0, 0->1)
                                                // Pero internamente (rawVal) sigue siendo 1=ON, así que las mates no fallan.
                                                const displayVal = (item.source === 'right') ? (rawVal === 1 ? 0 : 1) : rawVal;
                                                // ---------------------------------
                                                
                                                return <td key={`${item.source}-${item.index}`} className={`font-bold border-l border-slate-800 ${rawVal===1 ? 'text-white bg-green-900/20' : 'text-slate-600'}`}>{displayVal}</td> 
                                            })}</tr>
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}