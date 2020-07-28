/**
 * Menú per executar scripts interactivament
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('XATBOTS')
      .addSubMenu(ui.createMenu('Generar diplomes')
        .addItem('GDoc', 'genera_diplomes_GDOC')
        .addItem('ODT',  'genera_diplomes_ODT')
        .addItem('PDF',  'genera_diplomes_PDF'))
      .addToUi();
}

function genera_diplomes_GDOC() {
  genera_diploma();
}

function genera_diplomes_ODT() {
  genera_diploma(FileModel.EXTENSION_ODT);
}

function genera_diplomes_PDF() {
  genera_diploma(FileModel.EXTENSION_PDF);
}
