const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const angleInput = document.getElementById("angleInput");
const materialSelect = document.getElementById("materialSelect");
const outputN2 = document.getElementById("output");
const angleOut = document.getElementById("angleOut");
const reflectOut = document.getElementById("reflectOut");

const formulaBox = document.getElementById("formulaBox");

const n1 = 1.00;

function updateValue() {
    let n = materialSelect.value;
    outputN2.textContent = n === "" ? "—" : n;
    draw();
}

function draw() {
    let alphaDeg = parseFloat(angleInput.value);
    let alpha = alphaDeg * Math.PI / 180;
    reflectOut.textContent = alphaDeg.toFixed(2) + "°";


    let n2 = parseFloat(materialSelect.value);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    const L = 200;

   
    ctx.fillStyle = "#d7f6ff";
    ctx.fillRect(0, 0, canvas.width, midY);

    ctx.fillStyle = "#8bd0f9";
    ctx.fillRect(0, midY, canvas.width, midY);

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "red";
    let ix = midX - L * Math.sin(alpha);
    let iy = midY - L * Math.cos(alpha);

    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(ix, iy);
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("α", midX - 40, midY - 10);

    let rx = midX + L * Math.sin(alpha);
    let ry = midY - L * Math.cos(alpha);

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    ctx.fillText("β", midX + 30, midY - 10);

    if (isNaN(n2)) {
        angleOut.textContent = "—";
        formulaBox.innerHTML = "n₁ sin(α) = n₂ sin(γ)";
        return;
    }

    let sinGamma = (n1 / n2) * Math.sin(alpha);

    if (sinGamma > 1) {
        angleOut.textContent = "Pilnā iekšējā atstarošanās";
        formulaBox.innerHTML = `n₁ sin(${alphaDeg}°) &gt; n₂ → nav refrakcijas`;
        return;
    }

    let gamma = Math.asin(sinGamma);
    let gammaDeg = gamma * 180 / Math.PI;

    angleOut.textContent = gammaDeg.toFixed(2) + "°";

    let tx = midX + L * Math.sin(gamma);
    let ty = midY + L * Math.cos(gamma);

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.fillText("γ", midX + 25, midY + 30);

    formulaBox.innerHTML =
        `1· sin(${alphaDeg.toFixed(1)}°) = ${n2} · sin(${gammaDeg.toFixed(1)}°)`;
}

angleInput.addEventListener("input", draw);
materialSelect.addEventListener("change", updateValue);

updateValue();
