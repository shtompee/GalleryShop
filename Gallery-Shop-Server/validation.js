const form = document.getElementById("myForm");

form.addEventListener("submit", function (event) {
  event.preventDefault(); // Отменяем отправку формы по умолчанию

  // Проверка полей формы
  const nameInput = form.elements["name"];
  const prodYearInput = form.elements["prod_year"];
  const priceInput = form.elements["price"];
  const paintSizeInput = form.elements["paint_size"];
  const techlogyInput = form.elements["techlogy"];
  const imageInput = form.elements["image"];

  if (nameInput.value.trim() === "") {
    alert("Введите имя");
    return;
  }

  if (prodYearInput.value.trim() === "") {
    alert("Введите год производства");
    return;
  }

  if (priceInput.value.trim() === "") {
    alert("Введите цену");
    return;
  }

  if (paintSizeInput.value.trim() === "") {
    alert("Введите размер картины");
    return;
  }

  if (techlogyInput.value.trim() === "") {
    alert("Введите технику");
    return;
  }

  if (imageInput.files.length === 0) {
    alert("Выберите изображение");
    return;
  }

  // Если все поля заполнены и выбран файл, можно отправить форму
  form.submit();
});
