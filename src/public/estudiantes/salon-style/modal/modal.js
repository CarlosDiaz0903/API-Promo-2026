function openStudentModal(student) {
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  const box = document.createElement("div");
  box.style.width = "600px";
  box.style.height = "400px";
  box.style.background = "#fff";
  box.style.borderRadius = "20px";

  modal.appendChild(box);
  document.body.appendChild(modal);

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}
