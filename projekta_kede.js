window.addEventListener("DOMContentLoaded", () => {
  const Uel = document.getElementById("voltage");
  const Iel = document.getElementById("current");

  const r1El = document.getElementById("r1");
  const r2El = document.getElementById("r2");
  const r3El = document.getElementById("r3");

  const rTotalEl = document.getElementById("rTotal");
  const formulaBox = document.getElementById("formulaBox");

  let active = null; 

  function setLetters() {
    formulaBox.textContent = "I = V / (R₁ + R₂ + R₃)";
    rTotalEl.textContent = "—";
  }

  function update() {
    const R1 = +r1El.value;
    const R2 = +r2El.value;
    const R3 = +r3El.value;

    if ([R1, R2, R3].some(v => isNaN(v) || v < 0)) {
      setLetters();
      return;
    }

    const Rsum = R1 + R2 + R3;

    if (Rsum <= 0) {
      setLetters();
      return;
    }

    rTotalEl.textContent = Rsum.toFixed(2);

    let U = +Uel.value;
    let I = +Iel.value;

    if (active === "U" && U > 0) {
      I = U / Rsum;
      Iel.value = I.toFixed(3);
    } else if (active === "I" && I > 0) {
      U = I * Rsum;
      Uel.value = U.toFixed(2);
    }

    if (!(U > 0) || !(I > 0)) {
      setLetters();
      return;
    }

    
    formulaBox.textContent =
      `${I.toFixed(3)} = ${U.toFixed(0)} / (${R1.toFixed(0)} + ${R2.toFixed(0)} + ${R3.toFixed(0)})`;
  }

  Uel.addEventListener("input", () => { active = "U"; update(); });
  Iel.addEventListener("input", () => { active = "I"; update(); });

  [r1El, r2El, r3El].forEach(r => r.addEventListener("input", update));

  setLetters();
});
