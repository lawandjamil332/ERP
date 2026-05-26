/**
 * Excel export — emits the OpenXML SpreadsheetML 2003 ("XML Spreadsheet") format.
 */

export interface SheetData {
  name: string;
  headers: string[];
  rows: (string | number | null)[][];
}

export function toXmlSpreadsheet(sheets: SheetData[]): string {
  const xmlSheets = sheets.map((s) => {
    const headerCells = s.headers.map((h) => cell(h, 'String', true)).join('');
    const bodyRows = s.rows.map((row) => {
      const cells = row.map((v) => {
        if (v === null || v === undefined) return cell('', 'String');
        return typeof v === 'number'
          ? cell(String(v), 'Number')
          : cell(String(v), 'String');
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('');
    return `<Worksheet ss:Name="${escapeAttr(s.name)}">
      <Table>
        <Row>${headerCells}</Row>
        ${bodyRows}
      </Table>
    </Worksheet>`;
  }).join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1" /></Style>
  </Styles>
  ${xmlSheets}
</Workbook>`;
}

function cell(value: string, type: 'String' | 'Number', header = false): string {
  const styleAttr = header ? ' ss:StyleID="Header"' : '';
  return `<Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
}
function escapeAttr(s: string): string { return escapeXml(s); }
