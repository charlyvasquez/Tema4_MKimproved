import { QuineMcCluskey } from './qm'; 

// DEFINICIÓN DE VARIABLES SEGÚN MODO
const VAR_NAMES = {
  3: ['A', 'B', 'C'],
  4: ['A', 'B', 'C', 'D'],
  5: ['A', 'B', 'C', 'D', 'E'] 
};

// Función auxiliar para POS
function formatPOS(term) {
    if (term === "0" || term === "1") return term;
    // Captura cualquier letra de la A a la E
    const literals = term.match(/[A-E]'?/g);
    if (!literals) return term;

    const converted = literals.map(lit => {
        if (lit.includes("'")) return lit.replace("'", ""); 
        return lit + "'"; 
    });

    return `(${converted.join("+")})`;
}

export function solveKMap(mapValues, numVars, preferredMethod = 'AUTO') {
  const minterms = [];
  const maxterms = [];
  const totalCells = Math.pow(2, numVars);
  
  // Seguridad: Recortar mapValues si es más grande que lo necesario
  const activeValues = mapValues.slice(0, totalCells);

  for (let i = 0; i < totalCells; i++) {
    if (activeValues[i] === 1) minterms.push(i);
    else maxterms.push(i);
  }

  const currentVars = VAR_NAMES[numVars] || ['A','B','C','D','E'];
  const varsStr = currentVars.join(',');
  
  const fccMinterms = `f(${varsStr}) = Σ m(${minterms.join(', ')})`;
  const fccMaxterms = `f(${varsStr}) = Π M(${maxterms.join(', ')})`;
  const fccMintermsExpanded = `f = ` + (minterms.length > 0 ? minterms.map(m => `m${m}`).join(" + ") : "0");
  const fccMaxtermsExpanded = `f = ` + (maxterms.length > 0 ? maxterms.map(m => `M${m}`).join(" · ") : "1");

  const numOnes = minterms.length;
  const numZeros = maxterms.length;
  let suggestion = "";
  let bestMethod = "SOP";

  // Umbrales dinámicos según tamaño del mapa
  const halfCells = totalCells / 2;
  
  if (numOnes < numZeros) {
      suggestion = `💡 SUGERENCIA: Minitérminos (SOP). Menos 1s (${numOnes}) que 0s (${numZeros}).`;
      bestMethod = "SOP";
  } else if (numZeros < numOnes) {
      suggestion = `💡 SUGERENCIA: Maxitérminos (POS). Menos 0s (${numZeros}) que 1s (${numOnes}).`;
      bestMethod = "POS";
  } else {
      suggestion = `⚖️ BALANCEADO: ${halfCells} vs ${halfCells}.`;
      bestMethod = "SOP";
  }

  let methodToUse = preferredMethod === 'AUTO' ? bestMethod : preferredMethod;
  let simplifiedEquation = "";
  let groupsResult = [];
  let fcaEquation = ""; 

  try {
    if (methodToUse === 'SOP') {
        const solver = new QuineMcCluskey(currentVars); 
        const result = solver.solve(minterms); 
        
        simplifiedEquation = `f = ${result.equation}`;
        fcaEquation = `f = ${result.fca}`; 
        groupsResult = result.groups;

    } else {
        const solver = new QuineMcCluskey(currentVars);
        const result = solver.solve(maxterms);
        
        let rawEq = result.equation;
        if(rawEq === "0") simplifiedEquation = `f = 0`; 
        else if(result.equation === "1") simplifiedEquation = `f = 0`; 
        else if (maxterms.length === 0) simplifiedEquation = `f = 1`; 
        else {
            const posTerms = result.groups.map(g => formatPOS(g.term));
            simplifiedEquation = `f = ${posTerms.join("")}`; 
        }
        
        const fcaParts = maxterms.map(m => {
            const bin = m.toString(2).padStart(numVars, '0');
            let term = "";
            for(let i=0; i<numVars; i++) {
                term += currentVars[i] + (bin[i]==='1' ? "'" : ""); 
                if(i < numVars-1) term += "+";
            }
            return `(${term})`;
        });
        fcaEquation = `f = ${fcaParts.join("")}`;

        groupsResult = result.groups.map(g => ({
            ...g,
            term: formatPOS(g.term) 
        }));
    }

  } catch (error) {
    console.error("Error:", error);
    simplifiedEquation = "Error"; 
  }

  return {
    fccMinterms, fccMintermsExpanded,
    fccMaxterms, fccMaxtermsExpanded,
    simplifiedEquation, fcaEquation, 
    groupsResult, suggestion, activeMethod: methodToUse,
    counts: { ones: numOnes, zeros: numZeros }
  };
}