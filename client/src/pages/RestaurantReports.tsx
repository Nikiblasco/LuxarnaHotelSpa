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
  UtensilsCrossed,
} from "lucide-react";

type ImportedDepartmentSale = {
  department: "restaurant";
  saleDate: string;
  description: string;
  quantity: number;
  roomReference: string | null;
  unitAmount: number;
  total: number;
  paymentMethod: string | null;
  staffName: string | null;
  sheetName: string;
  rowNumber: number;
};

type ImportResult = {
  success: boolean;
  imported: number;
  skipped: number;
  skippedRows?: Array<{
    index: number;
    rowNumber?: number;
    reason: string;
  }>;
};

function formatMoney(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[.\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? "")
    .replace(/[₦,\s]/g, "")
    .trim();

  if (!cleaned) return 0;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseQuantity(value: unknown): number {
  const parsed = parseMoney(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function excelDateToString(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

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

  const text = String(value ?? "").trim();

  if (!text) return null;

  const isoDate = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (isoDate) {
    const [, year, month, day] = isoDate;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;
  }

  // Matches dates such as 1/5/2026.
  const slashDate = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (slashDate) {
    const [, month, day, year] = slashDate;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;
  }

  return null;
}

function findHeaderRow(rows: unknown[][]): number {
  const rowsToCheck = rows.slice(0, 10);

  for (let index = 0; index < rowsToCheck.length; index += 1) {
    const headers = rowsToCheck[index].map(normalizeHeader);

    const hasDate = headers.includes("date");

    const hasDescription =
      headers.includes("description") ||
      headers.includes("food") ||
      headers.includes("item");

    const hasAmount =
      headers.includes("total") ||
      headers.includes("amount");

    if (hasDate && hasDescription && hasAmount) {
      return index;
    }
  }

  return -1;
}

function findColumn(
  headers: string[],
  possibleHeaders: string[]
): number {
  return headers.findIndex((header) =>
    possibleHeaders.includes(header)
  );
}

function parseRestaurantWorkbook(
  workbook: XLSX.WorkBook
): ImportedDepartmentSale[] {
  const importedSales: ImportedDepartmentSale[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    if (rows.length < 2) continue;

    const headerRowIndex = findHeaderRow(rows);

    if (headerRowIndex === -1) {
      console.warn(
        `[Restaurant Import] Skipping "${sheetName}" because the required headers were not found.`
      );

      continue;
    }

    const headers = rows[headerRowIndex].map(normalizeHeader);

    const dateColumn = findColumn(headers, ["date"]);

    const descriptionColumn = findColumn(headers, [
      "description",
      "food",
      "item",
      "meal",
    ]);

    const quantityColumn = findColumn(headers, [
      "quantity",
      "qty",
    ]);

    const roomColumn = findColumn(headers, [
      "room",
      "room no",
      "room number",
      "room reference",
    ]);

    const amountColumn = findColumn(headers, [
      "amount",
      "unit amount",
      "unit price",
      "price",
    ]);

    const totalColumn = findColumn(headers, [
      "total",
      "total amount",
    ]);

    const paymentColumn = findColumn(headers, [
      "payment",
      "payment method",
      "method",
    ]);

    const staffColumn = findColumn(headers, [
      "staff",
      "staff name",
      "served by",
      "waiter",
    ]);

    if (
      dateColumn === -1 ||
      descriptionColumn === -1 ||
      (amountColumn === -1 && totalColumn === -1)
    ) {
      console.warn(
        `[Restaurant Import] Skipping "${sheetName}" because DATE, DESCRIPTION/FOOD, or AMOUNT/TOTAL was not found.`
      );

      continue;
    }

    let currentDate: string | null = null;

    rows
      .slice(headerRowIndex + 1)
      .forEach((row, index) => {
        const suppliedDate = excelDateToString(
          row[dateColumn]
        );

        // Empty date cells inherit the previous date.
        if (suppliedDate) {
          currentDate = suppliedDate;
        }

        const description = String(
          row[descriptionColumn] ?? ""
        ).trim();

        const quantity =
          quantityColumn >= 0
            ? parseQuantity(row[quantityColumn])
            : 0;

        const roomReference =
          roomColumn >= 0
            ? String(row[roomColumn] ?? "")
                .trim()
                .replace(/\.0$/, "")
            : "";

        const amount =
          amountColumn >= 0
            ? parseMoney(row[amountColumn])
            : 0;

        const spreadsheetTotal =
          totalColumn >= 0
            ? parseMoney(row[totalColumn])
            : 0;

        // January and February use TOTAL.
        // March uses AMOUNT.
        const total =
          spreadsheetTotal > 0
            ? spreadsheetTotal
            : amount;

        const unitAmount =
          amount > 0 ? amount : total;

        if (
          !currentDate ||
          !description ||
          !Number.isFinite(total) ||
          total <= 0
        ) {
          return;
        }

        importedSales.push({
          department: "restaurant",
          saleDate: currentDate,
          description,
          quantity,
          roomReference: roomReference || null,
          unitAmount,
          total,
          paymentMethod:
            paymentColumn >= 0
              ? String(row[paymentColumn] ?? "").trim() ||
                null
              : null,
          staffName:
            staffColumn >= 0
              ? String(row[staffColumn] ?? "").trim() ||
                null
              : null,
          sheetName,
          rowNumber: headerRowIndex + index + 2,
        });
      });
  }

  return importedSales;
}

export default function RestaurantReports() {
  const { toast } = useToast();

  const excelInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  const [isReadingExcel, setIsReadingExcel] =
    useState(false);

  const [fileName, setFileName] = useState("");

  const [importedSales, setImportedSales] = useState<
    ImportedDepartmentSale[]
  >([]);

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
      sales: ImportedDepartmentSale[]
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

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.error ??
            "Unable to import restaurant sales."
        );
      }

      return responseData as ImportResult;
    },

    onSuccess: (data) => {
      setLastResult(data);
      setImportedSales([]);
      setFileName("");

      toast({
        title: "Restaurant report imported",
        description: `${data.imported} rows added and ${data.skipped} rows skipped.`,
      });
    },

    onError: (error: any) => {
      toast({
        title: "Import failed",
        description:
          error.message ??
          "Unable to import restaurant report.",
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
        parseRestaurantWorkbook(workbook);

      if (parsedSales.length === 0) {
        throw new Error(
          "No valid restaurant sales were found. Check the DATE, DESCRIPTION/FOOD and AMOUNT/TOTAL columns."
        );
      }

      setImportedSales(parsedSales);

      toast({
        title: "Monthly report loaded",
        description: `${parsedSales.length} restaurant sales are ready for review.`,
      });
    } catch (error: any) {
      console.error(
        "[Restaurant Import] Excel read error:",
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

      // Allows the same file to be selected again.
      event.target.value = "";
    }
  }

  const reportTotal = importedSales.reduce(
    (sum, sale) => sum + sale.total,
    0
  );

  const firstDate =
    importedSales.length > 0
      ? importedSales
          .map((sale) => sale.saleDate)
          .sort()[0]
      : null;

  const lastDate =
    importedSales.length > 0
      ? importedSales
          .map((sale) => sale.saleDate)
          .sort()
          .at(-1) ?? null
      : null;

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              Restaurant Reports Access
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
            <UtensilsCrossed className="w-7 h-7" />

            <h1 className="text-3xl font-semibold">
              Restaurant Reports
            </h1>
          </div>

          <p className="text-muted-foreground mt-2">
            Import one monthly kitchen Excel report at a
            time.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Import Monthly Restaurant Report
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
                  <span>{fileName}</span>
                </div>
              )}
            </div>

            {importedSales.length > 0 && (
              <>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs text-muted-foreground">
                      Rows detected
                    </p>

                    <p className="text-xl font-semibold">
                      {importedSales.length}
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

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs text-muted-foreground">
                      Date range
                    </p>

                    <p className="text-sm font-semibold">
                      {firstDate === lastDate
                        ? firstDate
                        : `${firstDate} – ${lastDate}`}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3">Row</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">
                          Description
                        </th>
                        <th className="p-3">Room</th>
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
                            key={`${sale.sheetName}-${sale.rowNumber}-${index}`}
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

                            <td className="p-3">
                              {sale.roomReference || "—"}
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
                    {importedSales.length} rows.
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
                    `Import ${importedSales.length} Restaurant Sales`
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

                {lastResult.skippedRows &&
                  lastResult.skippedRows.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">
                        Skipped rows
                      </p>

                      <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground space-y-1">
                        {lastResult.skippedRows
                          .slice(0, 20)
                          .map((row, index) => (
                            <p key={index}>
                              Row{" "}
                              {row.rowNumber ??
                                row.index + 1}
                              : {row.reason}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}