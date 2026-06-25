/** Stößt im Browser den Download einer Textdatei (UTF-8) an. */
export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType = "text/csv;charset=utf-8"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
