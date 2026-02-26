export class QuineMcCluskey {
  constructor(variables) {
    this.variables = variables;
  }

  solve(minterms) {
    const numVars = this.variables.length;
    const totalCells = Math.pow(2, numVars);
    
    if (minterms.length === 0) return { equation: "0", groups: [], fca: "0" };
    if (minterms.length === totalCells) return { equation: "1", groups: [{ type: "Total", term: "1", cells: minterms }], fca: "1" };

    let primes = this.getPrimeImplicants(minterms);
    primes.sort((a, b) => {
        const dashesB = b.split('-').length - 1;
        const dashesA = a.split('-').length - 1;
        return dashesB - dashesA; 
    });

    let solutionGroups = [];
    let coveredMinterms = new Set();

    for (let prime of primes) {
        const coveredByPrime = this.getMintermsFromBinary(prime);
        let addsNewInfo = false;
        for (let m of coveredByPrime) {
            if (!coveredMinterms.has(m)) {
                addsNewInfo = true;
                break;
            }
        }
        if (addsNewInfo) {
            solutionGroups.push(prime);
            coveredByPrime.forEach(m => coveredMinterms.add(m));
        }
        let allCovered = true;
        for (let m of minterms) {
            if (!coveredMinterms.has(m)) {
                allCovered = false;
                break;
            }
        }
        if (allCovered) break;
    }

    const finalGroups = solutionGroups.map(bin => {
        const term = this.toExpression(bin);
        const cells = this.getMintermsFromBinary(bin);
        const size = cells.length;
        
        let type = "Grupo";
        if (size === 2) type = "Par";
        if (size === 4) type = "Cuarteto";
        if (size === 8) type = "Octeto"; 
        if (size === 16) type = "Hexadeceto";

        // Reglas de nomenclatura específicas para 5 variables (opcional adaptarlas a 4)
        if (numVars === 5) {
             if (size === 4) type = "Cuarteto (Par Arr + Par Ab)";
             if (size === 8) type = "Octeto (Cuarteto Arr + Cuarteto Ab)";
        }

        return {
            binary: bin,
            term: term,
            cells: cells,
            type: type,
            size: size
        };
    });

    const equation = finalGroups.map(g => g.term).join(" + ");
    const fca = minterms.map(m => {
        const bin = m.toString(2).padStart(numVars, '0');
        return this.toExpression(bin); 
    }).join(" + ");

    return { equation, groups: finalGroups, fca };
  }

  getPrimeImplicants(minterms) {
    const numVars = this.variables.length;
    let groups = Array.from({ length: numVars + 1 }, () => []);
    minterms.forEach(m => {
      const bin = m.toString(2).padStart(numVars, '0');
      const ones = bin.split('1').length - 1;
      groups[ones].push({ bin, used: false });
    });

    let primeImplicants = new Set();
    let merged = true;

    while (merged) {
      merged = false;
      let newGroups = Array.from({ length: numVars + 1 }, () => []);
      for (let i = 0; i < groups.length - 1; i++) {
        for (let t1 of groups[i]) {
          for (let t2 of groups[i+1]) {
            const diff = this.getDifference(t1.bin, t2.bin);
            if (diff.count === 1) {
              t1.used = true;
              t2.used = true;
              const newBin = t1.bin.substring(0, diff.index) + '-' + t1.bin.substring(diff.index + 1);
              if (!newGroups[i].some(g => g.bin === newBin)) {
                newGroups[i].push({ bin: newBin, used: false });
              }
              merged = true;
            }
          }
        }
      }
      for (let g of groups) {
        for (let t of g) {
          if (!t.used) primeImplicants.add(t.bin);
        }
      }
      if (merged) groups = newGroups;
    }
    return Array.from(primeImplicants);
  }

  getDifference(bin1, bin2) {
    let count = 0;
    let index = -1;
    for (let i = 0; i < bin1.length; i++) {
      if (bin1[i] !== bin2[i]) { count++; index = i; }
    }
    return { count, index };
  }

  getMintermsFromBinary(binary) {
    let results = [0];
    for (let i = 0; i < binary.length; i++) {
        const char = binary[i];
        const bitVal = Math.pow(2, binary.length - 1 - i);
        if (char === '1') results = results.map(r => r + bitVal);
        else if (char === '-') {
            const withOne = results.map(r => r + bitVal);
            results = results.concat(withOne);
        }
    }
    return results.sort((a,b) => a-b);
  }

  toExpression(binaryStr) {
    let expr = "";
    for (let i = 0; i < binaryStr.length; i++) {
      if (binaryStr[i] !== '-') {
        expr += this.variables[i] + (binaryStr[i] === '0' ? "'" : "");
      }
    }
    return expr || "1";
  }
}