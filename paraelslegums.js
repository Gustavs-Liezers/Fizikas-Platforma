window.addEventListener("DOMContentLoaded", () => {
  const Uel = document.getElementById("voltage");
  const Iel = document.getElementById("current");

  const r1El = document.getElementById("r1");
  const r2El = document.getElementById("r2");
  const r3El = document.getElementById("r3");
  const r4El = document.getElementById("r4");
  const r5El = document.getElementById("r5");

  const fR123 = document.getElementById("fR123");
  const fRk   = document.getElementById("fRk");
  const fI    = document.getElementById("fI");
  const fI123 = document.getElementById("fI123");
  const fI4   = document.getElementById("fI4");
  const fI5   = document.getElementById("fI5");

  let active = null;

  function setLetters() {
    fR123.textContent = "R₁₂₃ = R₁ + R₂ + R₃";
    fRk.textContent   = "Rₖ = 1 / (1/R₁₂₃ + 1/R₄ + 1/R₅)";
    fI.textContent    = "I = U / Rₖ";
    fI123.textContent = "I₁ = I₂ = I₃ = U / R₁₂₃";
    fI4.textContent   = "I₄ = U / R₄";
    fI5.textContent   = "I₅ = U / R₅";
  }

  function update() {
    const R1 = +r1El.value;
    const R2 = +r2El.value;
    const R3 = +r3El.value;
    const R4 = +r4El.value;
    const R5 = +r5El.value;

    
    const seriesParts = [R1, R2, R3].filter(r => r > 0);
    const branch123Active = seriesParts.length > 0;
    const branch4Active = R4 > 0;
    const branch5Active = R5 > 0;

    
    if (!branch123Active && !branch4Active && !branch5Active) {
      setLetters();
      return;
    }

    
    const R123 = branch123Active ? seriesParts.reduce((a, b) => a + b, 0) : null;

    const invTerms = [];
    if (branch123Active) invTerms.push(`1/${R123.toFixed(0)}`);
    if (branch4Active)   invTerms.push(`1/${R4.toFixed(0)}`);
    if (branch5Active)   invTerms.push(`1/${R5.toFixed(0)}`);

    const invSum = (branch123Active ? 1 / R123 : 0) + (branch4Active ? 1 / R4 : 0) + (branch5Active ? 1 / R5 : 0);
    const Rk = 1 / invSum;

    let U = +Uel.value;
    let I = +Iel.value;

    if (active === "U" && U > 0) {
      I = U / Rk;
      Iel.value = I.toFixed(3);
    } else if (active === "I" && I > 0) {
      U = I * Rk;
      Uel.value = U.toFixed(2);
    }

    if (!(U > 0) || !(I > 0)) {
      setLetters();
      return;
    }

    const I123 = branch123Active ? U / R123 : 0;
    const I4 = branch4Active ? U / R4 : 0;
    const I5 = branch5Active ? U / R5 : 0;

    
    if (branch123Active) {
      const seriesShown = [R1, R2, R3].filter(r => r > 0).map(r => r.toFixed(0)).join(" + ");
      fR123.textContent = `${R123.toFixed(0)} = ${seriesShown}`;
      fI123.textContent = `${I123.toFixed(3)} = ${U.toFixed(0)} / ${R123.toFixed(0)}`;
    } else {
      fR123.textContent = "R₁₂₃ = (izslēgts)";
      fI123.textContent = "I₁ = I₂ = I₃ = 0";
    }

    fRk.textContent = `${Rk.toFixed(2)} = 1 / (${invTerms.join(" + ")})`;

    fI.textContent = `${I.toFixed(0)} = ${U.toFixed(0)} / ${Rk.toFixed(2)}`;

    fI4.textContent = branch4Active ? `${I4.toFixed(3)} = ${U.toFixed(0)} / ${R4.toFixed(0)}` : "I₄ = 0 (izslēgts)";
    fI5.textContent = branch5Active ? `${I5.toFixed(3)} = ${U.toFixed(0)} / ${R5.toFixed(0)}` : "I₅ = 0 (izslēgts)";
  }

  Uel.addEventListener("input", () => { active = "U"; update(); });
  Iel.addEventListener("input", () => { active = "I"; update(); });

  [r1El, r2El, r3El, r4El, r5El].forEach(el => el.addEventListener("input", update));

  setLetters();
});
