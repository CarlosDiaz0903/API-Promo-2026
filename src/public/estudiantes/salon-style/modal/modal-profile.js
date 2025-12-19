function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).toUpperCase();
}

export function buildProfileSection(student) {
  const profile = document.createElement("section");
  profile.className = "modal-profile";

  const profileContent = document.createElement("div");
  profileContent.className = "profile-content";

  // -------- ACCOUNT --------
  const account = document.createElement("div");
  account.className = "account";

  // FOTO
  const photoDiv = document.createElement("div");
  photoDiv.className = "profile-photo";

  const photoSrc = student.photo && student.photo !== ""
    ? student.photo
    : "../salon-style/tarjetas/unknown.png";

  photoDiv.style.backgroundImage = `url("${photoSrc}")`;

  if (!student.photo) {
    photoDiv.style.opacity = "0.31";
  }

  // NOMBRE
  const nameDiv = document.createElement("div");
  nameDiv.className = "profile-name";

  const [firstName, ...rest] = student.name.split(" ");
  const lastName = rest.join(" ");

  const firstSpan = document.createElement("span");
  firstSpan.className = "first-name";
  firstSpan.textContent = firstName.toUpperCase();

  const lastSpan = document.createElement("span");
  lastSpan.className = "last-name";
  lastSpan.textContent = lastName.toUpperCase();

  nameDiv.append(firstSpan, lastSpan);
  account.append(photoDiv, nameDiv);

  // -------- META --------
  const meta = document.createElement("div");
  meta.className = "meta";

  // DATA
  const data = document.createElement("div");
  data.className = "data";

  const idSpan = document.createElement("span");
  idSpan.textContent = `ID: ${student.schoolId}`;

  const birthdaySpan = document.createElement("span");
  birthdaySpan.textContent = formatDate(student.birthday);

  data.append(idSpan, birthdaySpan);

  // FRASE
  const quoteDiv = document.createElement("div");
  quoteDiv.className = "quote";

  const quoteUp = document.createElement("img");
  quoteUp.src = "../salon-style/modal/comilla-up.png";
  quoteUp.className = "quote-mark up";

  const quoteSpan = document.createElement("span");
  quoteSpan.textContent = student.quote || "";

  const quoteDown = document.createElement("img");
  quoteDown.src = "../salon-style/modal/comilla-down.png";
  quoteDown.className = "quote-mark down";

  quoteDiv.append(quoteUp, quoteSpan, quoteDown);

  // BOTÓN
  const shareBtn = document.createElement("button");
  shareBtn.className = "share-profile";
  shareBtn.textContent = "COMPARTIR PERFIL";

  meta.append(data, quoteDiv, shareBtn);

  profileContent.append(account, meta);
  profile.appendChild(profileContent);

  return profile;
}
