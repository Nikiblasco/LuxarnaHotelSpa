import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  FileSpreadsheet,
  Loader2,
  Upload,
  Wine,
} from "lucide-react";

type ImportedBarSale = {
  department: "bar";
  saleDate: string;
  description: string;
  quantity: number;
  roomReference: null;
  unitAmount: number;
  total: number;
  paymentMethod: null;
  staffName: null;
  sheetName: string;
  rowNumber: number;
};

type ImportResult = {
  imported: number;
  skipped: number;
};

function formatMoney(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function parseNumber(value: unknown): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value)
    .replace(/[₦,\s]/g, "")
    .trim();

  if (!cleaned) return 0;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function excelDateToString(
  value: unknown
): string | null {
  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    const year = value.getFullYear();
    const month = String(
      value.getMonth() + 1
    ).padStart(2, "0");
    const day = String(value.getDate()).padStart(
      2,
      "0"
    );

    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) return null;

    return [
      parsed.y,
      String(parsed.m).padStart(2, "0"),
      String(parsed.d).padStart(2, "0"),
    ].join("-");
  }

  const text = normalizeText(value);

  if (!text) return null;

  const isoDate = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (isoDate) {
    const [, year, month, day] = isoDate;

    return `${year}-${month.padStart(
      2,
      "0"
    )}-${day.padStart(2, "0")}`;
  }

  const slashDate = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (slashDate) {
    const [, month, day, year] = slashDate;

    return `${year}-${month.padStart(
      2,
      "0"
    )}-${day.padStart(2, "0")}`;
  }

  return null;
}

function findHeaderRow(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);

    return (
      headers[0] === "date" &&
      headers.includes("open") &&
      headers.includes("sold") &&
      headers.includes("price")
    );
  });
}

function parseBarWorkbook(
  workbook: XLSX.WorkBook
): ImportedBarSale[] {
  const importedSales: ImportedBarSale[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<
      unknown[]
    >(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    if (rows.length < 4) continue;

    const headerRowIndex = findHeaderRow(rows);

    if (headerRowIndex <= 0) {
      console.warn(
        `[Bar Import] Headers were not found in "${sheetName}".`
      );

      continue;
    }

    const productRow =
      rows[headerRowIndex - 1] ?? [];

    const headerRow =
      rows[headerRowIndex] ?? [];

    type ProductGroup = {
      name: string;
      soldColumn: number;
      priceColumn: number;
    };

    const productGroups: ProductGroup[] = [];

    /*
     * Each valid product group has this structure:
     *
     * Product name
     * OPEN | NEW | SOLD | PRICE
     */
    for (
      let column = 1;
      column < headerRow.length;
      column += 1
    ) {
      const header = normalizeHeader(
        headerRow[column]
      );

      if (header !== "open") continue;

      const productName = normalizeText(
        productRow[column]
      );

      const newHeader = normalizeHeader(
        headerRow[column + 1]
      );

      const soldHeader = normalizeHeader(
        headerRow[column + 2]
      );

      const priceHeader = normalizeHeader(
        headerRow[column + 3]
      );

      if (
        !productName ||
        newHeader !== "new" ||
        soldHeader !== "sold" ||
        priceHeader !== "price"
      ) {
        continue;
      }

      productGroups.push({
        name: productName,
        soldColumn: column + 2,
        priceColumn: column + 3,
      });
    }

    if (productGroups.length === 0) {
      console.warn(
        `[Bar Import] No product groups were found in "${sheetName}".`
      );

      continue;
    }

    rows
      .slice(headerRowIndex + 1)
      .forEach((row, index) => {
        const saleDate = excelDateToString(row[0]);

        /*
         * The final TOTAL row does not contain a date,
         * so it is automatically ignored.
         */
        if (!saleDate) return;

        for (const product of productGroups) {
          // Blank/black spreadsheet cells become zero.
          const quantity = Math.max(
            0,
            Math.round(
              parseNumber(row[product.soldColumn])
            )
          );

          const total = Math.max(
            0,
            parseNumber(row[product.priceColumn])
          );

          /*
           * Only create a sale when something was sold
           * and a positive total was recorded.
           */
          if (quantity <= 0 || total <= 0) {
            continue;
          }

          const unitAmount = total / quantity;

          importedSales.push({
            department: "bar",
            saleDate,
            description: product.name,
            quantity,
            roomReference: null,
            unitAmount,
            total,
            paymentMethod: null,
            staffName: null,
            sheetName,
            rowNumber:
              headerRowIndex + index + 2,
          });
        }
      });
  }

  return importedSales;
}

export default function BarReports() {
  const { toast } = useToast();

  const excelInputRef =
    useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  const [isReadingExcel, setIsReadingExcel] =
    useState(false);

  const [fileName, setFileName] = useState("");

  const [importedSales, setImportedSales] =
    useState<ImportedBarSale[]>([]);

  const [lastResult, setLastResult] =
    useState<ImportResult | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (adminPassword: string) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/login",
        {
          password: adminPassword,
        }
      );

      if (!response.ok) {
        throw new Error("Access denied");
      }

      return response.json();
    },

    onSuccess: () => {
      setIsAuth(true);
    },

    onError: () => {
      toast({
        title: "Access Denied",
        description: "Incorrect admin password.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (
      sales: ImportedBarSale[]
    ) => {
      const payload = sales.map(
        ({
          sheetName,
          rowNumber,
          ...sale
        }) => ({
          ...sale,
          rowNumber,
        })
      );

      const response = await apiRequest(
        "POST",
        "/api/department-sales/import",
        payload
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ??
            "Unable to import bar report."
        );
      }

      return result as ImportResult;
    },

    onSuccess: (result) => {
      setLastResult(result);
      setImportedSales([]);
      setFileName("");

      toast({
        title: "Bar report imported",
        description: `${result.imported} rows added and ${result.skipped} rows skipped.`,
      });
    },

    onError: (error: any) => {
      toast({
        title: "Import failed",
        description:
          error.message ??
          "Unable to import bar report.",
        variant: "destructive",
      });
    },
  });

  async function handleExcelFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setIsReadingExcel(true);
      setImportedSales([]);
      setLastResult(null);
      setFileName(file.name);

      const fileBuffer = await file.arrayBuffer();

      const workbook = XLSX.read(fileBuffer, {
        type: "array",
        cellDates: true,
      });

      const parsedSales =
        parseBarWorkbook(workbook);

      if (parsedSales.length === 0) {
        throw new Error(
          "No valid bar sales were found. Check the DATE, product names, SOLD and PRICE columns."
        );
      }

      setImportedSales(parsedSales);

      toast({
        title: "Monthly bar report loaded",
        description: `${parsedSales.length} product sales are ready for review.`,
      });
    } catch (error: any) {
      console.error(
        "[Bar Import] Excel read error:",
        error
      );

      setImportedSales([]);
      setFileName("");

      toast({
        title: "Unable to read Excel file",
        description:
          error.message ??
          "Please check the spreadsheet format.",
        variant: "destructive",
      });
    } finally {
      setIsReadingExcel(false);
      event.target.value = "";
    }
  }

  const reportTotal = importedSales.reduce(
    (sum, sale) => sum + sale.total,
    0
  );

  const totalItemsSold = importedSales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  );

  const uniqueProducts = new Set(
    importedSales.map((sale) => sale.description)
  ).size;

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              Bar Reports Access
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Admin Password</Label>

              <Input
                type="password"
                placeholder="Enter Admin Password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    password.trim()
                  ) {
                    loginMutation.mutate(password);
                  }
                }}
              />
            </div>

            <Button
              className="w-full"
              disabled={
                loginMutation.isPending ||
                !password.trim()
              }
              onClick={() =>
                loginMutation.mutate(password)
              }
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking…
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-24">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Wine className="w-7 h-7" />

            <h1 className="text-3xl font-semibold">
              Bar Reports
            </h1>
          </div>

          <p className="text-muted-foreground mt-2">
            Import one monthly Bar Excel report at a
            time.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Import Monthly Bar Report
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelFile}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isReadingExcel}
                onClick={() =>
                  excelInputRef.current?.click()
                }
              >
                {isReadingExcel ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reading Excel…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select Monthly Excel File
                  </>
                )}
              </Button>

              {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="w-4 h-4" />
                  {fileName}
                </div>
              )}
            </div>

            {importedSales.length > 0 && (
              <>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs text-muted-foreground">
                      Sales rows
                    </p>

                    <p className="text-xl font-semibold">
                      {importedSales.length}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs text-muted-foreground">
                      Items sold
                    </p>

                    <p className="text-xl font-semibold">
                      {totalItemsSold}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs text-muted-foreground">
                      Report total
                    </p>

                    <p className="text-xl font-semibold">
                      {formatMoney(reportTotal)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {uniqueProducts} different products
                  detected.
                </p>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3">Row</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">
                          Product
                        </th>
                        <th className="p-3 text-right">
                          Sold
                        </th>
                        <th className="p-3 text-right">
                          Unit amount
                        </th>
                        <th className="p-3 text-right">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {importedSales
                        .slice(0, 10)
                        .map((sale, index) => (
                          <tr
                            key={`${sale.sheetName}-${sale.rowNumber}-${sale.description}-${index}`}
                            className="border-b"
                          >
                            <td className="p-3">
                              {sale.rowNumber}
                            </td>

                            <td className="p-3">
                              {sale.saleDate}
                            </td>

                            <td className="p-3">
                              {sale.description}
                            </td>

                            <td className="p-3 text-right">
                              {sale.quantity}
                            </td>

                            <td className="p-3 text-right">
                              {formatMoney(
                                sale.unitAmount
                              )}
                            </td>

                            <td className="p-3 text-right">
                              {formatMoney(sale.total)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {importedSales.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    Showing the first 10 of{" "}
                    {importedSales.length} sales.
                  </p>
                )}

                <Button
                  className="w-full"
                  disabled={importMutation.isPending}
                  onClick={() =>
                    importMutation.mutate(importedSales)
                  }
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    `Import ${importedSales.length} Bar Sales`
                  )}
                </Button>
              </>
            )}

            {lastResult && (
              <div className="rounded-lg border p-4">
                <p className="font-medium">
                  Last import completed
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  {lastResult.imported} rows added and{" "}
                  {lastResult.skipped} rows skipped.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}