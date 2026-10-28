module.exports = {
  // Ejecuta ESLint en archivos JS/TS
  // Ejecuta los tests relacionados a los archivos modificados
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'jest --bail --findRelatedTests --passWithNoTests']
};
