//Define o conjunto padrão de regras de substituição para a correção do texto
const nameRules = [
  { find: "æ", change: "a" },
  { find: "ß", change: "b" },
  { find: "¢", change: "c" },
  { find: "ø", change: "o" },
];

//Cria um objeto de erro
function newError(name, message) {
  return {
    name,
    message,
  };
}

//Exibe mensagem de erro
function errorMessage({ name, message = "" }) {
  if (!typeof message === "string") message = "";
  console.error("Erro " + name + ": " + message);
}

//Carrega o arquivo solicitado
function loadFile(filename) {
  try {
    const json = require(filename);
    return json;
  } catch ({ name }) {
    if (name == "Error")
      errorMessage(
        newError("fileNotFound", "o arquivo não pôde ser encontrado")
      );
    else
      errorMessage(newError("loadFailed", "ao carregar o arquivo " + filename));
    return false;
  }
}

//Salva o arquivo na pasta atual
function saveFile(name, content, extension = "json") {
  const fs = require("fs");
  try {
    if (typeof name !== "string")
      throw newError(
        "InvalidName",
        "Você deve dar um nome válido para o arquivo"
      );
    if (typeof content == "undefined")
      throw newError(
        "InvalidContent",
        "Você precisa informar o conteúdo do arquivo"
      );
    if (typeof content !== "string" && extension == "json")
      content = JSON.stringify(content);
    fs.writeFileSync("./" + name + "." + extension, content);
    return true;
  } catch (error) {
    if (error.name == "InvalidName" || error.name == "InvalidContent")
      errorMessage(error);
    else if (error instanceof SyntaxError)
      errorMessage(
        newError("InvalidName", "Você deve dar um nome válido para o arquivo")
      );
    else errorMessage(newError(error.name, "ao salvar o arquivo"));
    return false;
  }
}

//Substitui os caracteres de text conforme o conjunto de regras
//Rules: Um ou mais objetos com as propriedades find (string a ser buscada) e change (string que irá substituir)
function fixText(text, rules = nameRules) {
  try {
    if (typeof text != "string")
      throw newError("InvalidText", "O texto informado deve ser uma string");

    if (Array.isArray(rules)) {
      rules.forEach(({ find, change }) => {
        if (find === undefined || change === undefined)
          throw newError(
            "InvalidRules",
            "O conjunto de regras informado é inválido"
          );
        let newRegEx = new RegExp(find, "g");
        text = text.replace(newRegEx, change);
      });
    } else if (typeof rules === "object") {
      let { find, change } = rules;
      if (find === undefined || change === undefined)
        throw newError(
          "InvalidRules",
          "O conjunto de regras informado é inválido"
        );
      let newRegEx = new RegExp(find, "g");
      text = text.replace(newRegEx, change);
    } else {
      throw newError(
        "InvalidRules",
        "O conjunto de regras informado é inválido"
      );
    }
  } catch (error) {
    errorMessage(error);
  }

  return text;
}

//Converte o valor para float
function fixPrice(price) {
  let newFloat = parseFloat(price);
  try {
    if (isNaN(newFloat)) {
      throw newError(
        "InvalidPrice",
        "O valor informado deve ser um número ou string numérica"
      );
    } else return newFloat;
  } catch (error) {
    errorMessage(error);
  }
}

//Seta o atributo quantity caso o item não o possua
function fixQuantity(item) {
  try {
    if (typeof item != "object")
      throw newError("InvalidItem", "Item não é um objeto");
    if (!item.hasOwnProperty("quantity")) item.quantity = 0;
  } catch (error) {
    errorMessage(error);
  }
  return;
}

//Ordena o array por categoria e id
function fixOrder(jsonArr) {
  try {
    jsonArr.sort(function (a, b) {
      if (
        a.category === undefined ||
        b.category === undefined ||
        a.id === undefined ||
        b.id === undefined
      )
        throw newError("InvalidItem", "A array recebida tem itens inválidos");
      var categoryOrder =
        a.category > b.category ? 1 : a.category < b.category ? -1 : 0;
      var idOrder = a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
      return categoryOrder != 0 ? categoryOrder : idOrder;
    });
    console.log("Produtos ordenados crescentemente por categoria e id");
    console.table(jsonArr);
  } catch (error) {
    if (error instanceof TypeError)
      errorMessage(
        newError("InvalidType", "O parametro informado deve ser uma array")
      );
    else errorMessage(error);
  }
}

//Agrupa os itens do array por categoria e soma seus respectivos preços
function getTotalValueByCategory(jsonArr) {
  try {
    let valueByCategory = jsonArr.reduce(function (resultArr, item) {
      if (
        item.category === undefined ||
        item.price === undefined ||
        item.quantity === undefined
      )
        throw newError("InvalidItem", "A array recebida tem itens inválidos");

      if (item.category in resultArr) {
        resultArr[item.category] += item.price * item.quantity;
      } else {
        resultArr[item.category] = item.price * item.quantity;
      }
      return resultArr;
    }, []);
    console.log("Valor total em estoque por categoria");
    console.table(valueByCategory);
  } catch (error) {
    if (error instanceof TypeError)
      errorMessage(
        newError("InvalidType", "O parametro informado deve ser uma array")
      );
    else errorMessage(error);
  }
}

//Execução das funções e exibição dos resultados
function index() {
  const inputDb = loadFile("./broken_db.json");
  if (inputDb) {
    if (!Array.isArray(inputDb)) {
      errorMessage(
        newError("InvalidType", "O parametro informado deve ser uma array")
      );
      return;
    }

    inputDb.forEach(function (item, index, inputArr) {
      inputArr[index].name = fixText(item.name, nameRules);
      inputArr[index].price = fixPrice(item.price);
      fixQuantity(item);
    });
    if (saveFile("saida", inputDb)) {
      let fixedDb = loadFile("./saida.json");
      fixOrder(fixedDb);
      getTotalValueByCategory(fixedDb);
    }
  }
}

index();
