// Legacy XLSX loader intentionally disabled.
// Games must be created in Handball Performance OS and imported as Match JSON.
export function readExcelFile() {
    return Promise.reject(new Error('O carregamento de ficheiros XLSX foi descontinuado. Importa o Match JSON exportado pelo Handball Performance OS.'));
}
