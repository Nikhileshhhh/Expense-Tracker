import { jsPDF } from './pdfUtils';
import { formatCurrency } from './calculations';
import { getBankById } from './banks';
import Chart from 'chart.js/auto';

interface BankAccountData {
  bankName: string;
  nickname?: string;
  startingBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  createdAt?: string;
  monthlySavings: number;
  savingsRate: number;
  transactionCount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  includesInitialBalance: boolean;
}

interface CategoryData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

interface UserData {
  displayName?: string;
  email: string;
}

// Add a new type for per-account category breakdown
interface AccountCategoryBreakdown {
  bankAccountId: string;
  bankName: string;
  nickname?: string;
  categoryData: CategoryData[];
}

// At the top, import or define your base64 logo string
// import { logoImageBase64 } from './logo';
const logoImageBase64 = undefined; // TODO: Replace with your actual base64 string or import

const addLogoToPage = (doc: any, logo: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoWidth = 40;
  const logoHeight = 30;
  const x = pageWidth - logoWidth - 5; // 5px from right edge
  const y = 5; // Move logo further up
  if (logo) {
    doc.addImage(logo, 'PNG', x, y, logoWidth, logoHeight);
  }
};

// Test function to verify jsPDF is working
export const testPDFGeneration = () => {
  try {
    console.log('Testing PDF generation...');
    console.log('jsPDF available:', typeof jsPDF !== 'undefined');
    
    const doc = new jsPDF();
    console.log('jsPDF instance created successfully');
    
    doc.text('Test PDF', 20, 20);
    
    // Try different download methods
    try {
      doc.save('test.pdf');
      console.log('Test PDF saved successfully!');
      return true;
    } catch (saveError) {
      console.error('Save failed, trying data URI:', saveError);
      
      // Try data URI approach
      const dataUri = doc.output('datauristring');
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = 'test.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Test PDF downloaded via data URI!');
      return true;
    }
  } catch (error) {
    console.error('Test PDF generation failed:', error);
    return false;
  }
};

export type { MonthlyData, CategoryData, AccountCategoryBreakdown };

// Helper to load an image file and convert to base64
function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// --- Helper: User Info Section ---
function addUserInfo(doc: any, y: number, user: any, selectedYear: number): number {
  // Move user info table higher (closer to the top)
  const tableStartY = Math.max(y, 40);
  (doc as any).autoTable({
    startY: tableStartY,
    head: [[
      { content: 'Field', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Value', styles: { fontStyle: 'bold', halign: 'center' } }
    ]],
    body: [
      [ { content: 'Name', styles: { fontStyle: 'bold' } }, user.displayName || 'N/A' ],
      [ { content: 'Email', styles: { fontStyle: 'bold' } }, user.email ],
      [ { content: 'Year', styles: { fontStyle: 'bold' } }, selectedYear ],
      [ { content: 'Generated', styles: { fontStyle: 'bold' } }, new Date().toLocaleDateString() ]
    ],
    headStyles: { fillColor: [30, 64, 175], textColor: 255, font: 'helvetica', fontStyle: 'bold', halign: 'center' },
    bodyStyles: { font: 'helvetica', fontStyle: 'normal', fontSize: 11, halign: 'left' },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { cellPadding: 2 },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.5
  });
  return (doc as any).lastAutoTable.finalY + 10;
}

// Helper to always start content below the logo on new pages
function getSafeStartY(doc: any, y: number) {
  // If we're at the top of a new page, use at least 80px (for logo and spacing)
  return (y < 80) ? 80 : y;
}

// --- Helper: Bank Account Table ---
function addBankSummary(doc: any, y: number, bankAccounts: any[]): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text('Bank Account Summary', 20, y); y += 5;
  doc.setFont('helvetica', 'normal');
  (doc as any).autoTable({
    startY: getSafeStartY(doc, y),
    head: [[
      'Bank', 'Nickname', 'Starting', 'Income', 'Expense',
      'Balance', 'Savings', 'Rate', 'Transactions'
    ]],
    body: bankAccounts.map(acc => [
      { content: acc.bankName, styles: { fontStyle: 'bold' } },
      acc.nickname || '',
      formatCurrency(acc.startingBalance),
      formatCurrency(acc.totalIncome),
      formatCurrency(acc.totalExpense),
      formatCurrency(acc.currentBalance),
      formatCurrency(acc.monthlySavings),
      `${acc.savingsRate.toFixed(1)}%`,
      acc.transactionCount
    ]),
    headStyles: { fillColor: [30, 64, 175], textColor: 255, halign: 'center' },
    styles: { fontSize: 9, font: 'helvetica' },
    theme: 'grid',
    margin: { left: 15, right: 15 }
  });
  return (doc as any).lastAutoTable.finalY + 15;
}

// --- Helper: Monthly Analysis Table ---
function addMonthlyAnalysis(doc: any, y: number, monthlyData: any[]): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text('Monthly Analysis', 20, y); y += 5;
  doc.setFont('helvetica', 'normal');
  (doc as any).autoTable({
    startY: getSafeStartY(doc, y),
    head: [['Month', 'Income', 'Expenses', 'Savings', 'Includes Initial Balance?']],
    body: monthlyData.map(m => [
      { content: String(m.month), styles: { fontStyle: 'bold' } },
      formatCurrency(m.income),
      formatCurrency(m.expenses),
      formatCurrency(m.savings),
      m.includesInitialBalance ? 'Yes' : ''
    ]),
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9, font: 'helvetica' },
    theme: 'grid',
    margin: { left: 15, right: 15 }
  });
  return (doc as any).lastAutoTable.finalY + 15;
}

// --- Helper: Category Breakdown Table ---
function addCategoryBreakdown(doc: any, y: number, categoryData: any[]): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 99, 132);
  doc.text('Category Breakdown', 20, y); y += 5;
  doc.setFont('helvetica', 'normal');
  (doc as any).autoTable({
    startY: y,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData.map(c => [
      c.name,
      formatCurrency(c.value),
      `${(c.percentage ?? 0).toFixed(1)}%`
    ]),
    headStyles: { fillColor: [255, 99, 132], textColor: 255 },
    styles: { fontSize: 9, font: 'helvetica' },
    theme: 'grid',
    margin: { left: 15, right: 15 }
  });
  return (doc as any).lastAutoTable.finalY + 15;
}

// Helper for autoTable to add logo on every page
let autoTableOptsWithLogo: (opts: any) => any;

// --- Helper: Per-Account Category Breakdown ---
async function addAccountCategoryBreakdowns(doc: any, y: number, accountCategoryBreakdowns: any[]): Promise<number> {
  for (const accBreakdown of accountCategoryBreakdowns) {
    if (accBreakdown.categoryData && accBreakdown.categoryData.length > 0) {
      y = getSafeStartY(doc, y); // Ensure we start below the logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(251, 191, 36);
      doc.text(`Category Breakdown - ${accBreakdown.nickname || accBreakdown.bankName}`, 20, y); y += 5;
      doc.setFont('helvetica', 'normal');
      // Pie chart
      const pieUrl = await generatePieChartImage(accBreakdown.categoryData, 180, 180);
      y = getSafeStartY(doc, y); // Ensure pie chart is below logo if new page
      doc.addImage(pieUrl, 'PNG', 20, y, 50, 50);
      // Legend beside chart
      const legendX = 75;
      let legendY = y + 5;
      accBreakdown.categoryData.forEach((cat: any, idx: number) => {
        doc.setFillColor(cat.color || '#888');
        doc.rect(legendX, legendY + idx * 10, 6, 6, 'F');
        doc.setFontSize(9);
        doc.text(`${cat.name} (${cat.percentage !== undefined ? cat.percentage.toFixed(1) + '%' : ''})`, legendX + 10, legendY + 5 + idx * 10);
      });
      y += Math.max(55, accBreakdown.categoryData.length * 10) + 5;
      y = (doc as any).autoTable(autoTableOptsWithLogo({
        startY: getSafeStartY(doc, y),
        head: [['Category', 'Amount', 'Percentage']],
        body: accBreakdown.categoryData.map((cat: any) => [
          cat.name,
          formatCurrency(cat.value),
          `${(cat.percentage ?? 0).toFixed(1)}%`
        ]),
        styles: { fontSize: 9, font: 'helvetica' },
        headStyles: { fillColor: [251, 191, 36], textColor: 0 },
        margin: { left: 15, right: 15 },
        theme: 'grid'
      }));
      y = (doc as any).lastAutoTable.finalY + 15;
    }
  }
  return y;
}

// --- Helper: Summary Block ---
function addSummaryBlock(doc: any, y: number, bankAccounts: any[]): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('Financial Summary', 20, y); y += 7;
  doc.setFontSize(11);
  doc.setTextColor(0,0,0);
  const totalIncome = bankAccounts.reduce((sum, acc) => sum + acc.totalIncome, 0);
  const totalExpenses = bankAccounts.reduce((sum, acc) => sum + acc.totalExpense, 0);
  const totalSavings = bankAccounts.reduce((sum, acc) => sum + acc.monthlySavings, 0);
  doc.setFillColor(240, 249, 255);
  doc.rect(15, y-3, 180, 25, 'F');
  // Total Income
  doc.setFont('helvetica', 'bold');
  doc.text('Total Income:', 20, y+7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatCurrency(totalIncome)}`, 60, y+7);
  // Total Expenses
  doc.setFont('helvetica', 'bold');
  doc.text('Total Expenses:', 20, y+14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatCurrency(totalExpenses)}`, 60, y+14);
  // Total Savings
  doc.setFont('helvetica', 'bold');
  doc.text('Total Savings:', 20, y+21);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatCurrency(totalSavings)}`, 60, y+21);
  return y+30;
}

function ensureSpace(doc: any, y: number, neededSpace: number, logoImageBase64: string): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + neededSpace > pageHeight - 20) { // 20px bottom margin
    doc.addPage();
    addLogoToPage(doc, logoImageBase64);
    return 60; // safe top margin for new page
  }
  return y;
}

// --- Main Export Function ---
export const exportFinancialReport = async (
  user: UserData,
  bankAccounts: BankAccountData[],
  monthlyData: MonthlyData[],
  selectedYear: number,
  categoryData?: CategoryData[],
  accountCategoryBreakdowns?: AccountCategoryBreakdown[],
) => {
  try {
    const logoImageBase64 = await loadImageAsBase64('/src/assets/logo.png');
    const doc = new jsPDF();
    addLogoToPage(doc, logoImageBase64); // First page

    // Ensure logo is added after every new page
    doc.internal.events.subscribe('addPage', () => {
      addLogoToPage(doc, logoImageBase64);
    });

    let y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('ExpenseTracker - Financial Report', 15, y);
    y += 12;
    y = addUserInfo(doc, y, user, selectedYear);

    // Helper for autoTable to add logo on every page
    autoTableOptsWithLogo = (opts: any) => ({
      ...opts,
      didDrawPage: (data: any) => {
        addLogoToPage(doc, logoImageBase64);
        if (opts.didDrawPage) opts.didDrawPage(data);
      }
    });

    // Bank Summary
    y = (doc as any).autoTable(autoTableOptsWithLogo({
      startY: getSafeStartY(doc, y),
      head: [[
        'Bank', 'Nickname', 'Starting', 'Income', 'Expense',
        'Balance', 'Savings', 'Rate', 'Transactions'
      ]],
      body: bankAccounts.map(acc => [
        acc.bankName,
        acc.nickname || '',
        formatCurrency(acc.startingBalance),
        formatCurrency(acc.totalIncome),
        formatCurrency(acc.totalExpense),
        formatCurrency(acc.currentBalance),
        formatCurrency(acc.monthlySavings),
        `${acc.savingsRate.toFixed(1)}%`,
        acc.transactionCount
      ]),
      headStyles: { fillColor: [30, 64, 175], textColor: 255, halign: 'center' },
      styles: { fontSize: 9, font: 'helvetica' },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    }));
    y = (doc as any).lastAutoTable.finalY + 15;

    // Monthly Analysis
    y = (doc as any).autoTable(autoTableOptsWithLogo({
      startY: getSafeStartY(doc, y),
      head: [['Month', 'Income', 'Expenses', 'Savings', 'Includes Initial Balance?']],
      body: monthlyData.map(m => [
        m.month,
        formatCurrency(m.income),
        formatCurrency(m.expenses),
        formatCurrency(m.savings),
        m.includesInitialBalance ? 'Yes' : ''
      ]),
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9, font: 'helvetica' },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    }));
    y = (doc as any).lastAutoTable.finalY + 15;

    // Category Breakdown
    if (categoryData && categoryData.length > 0) {
      y = (doc as any).autoTable(autoTableOptsWithLogo({
        startY: getSafeStartY(doc, y),
        head: [['Category', 'Amount', 'Percentage']],
        body: categoryData.map(c => [
          c.name,
          formatCurrency(c.value),
          `${(c.percentage ?? 0).toFixed(1)}%`
        ]),
        headStyles: { fillColor: [255, 99, 132], textColor: 255 },
        styles: { fontSize: 9, font: 'helvetica' },
        theme: 'grid',
        margin: { left: 15, right: 15 }
      }));
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Per-Account Category Breakdown
    if (accountCategoryBreakdowns && accountCategoryBreakdowns.length > 0) {
      y = await addAccountCategoryBreakdowns(doc, y, accountCategoryBreakdowns);
    }

    // Ensure space for summary block
    y = ensureSpace(doc, y, 40, logoImageBase64);
    // Summary Block
    y = addSummaryBlock(doc, y, bankAccounts);
    const fileName = `Financial_Report_${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
  }
};

// Utility: Generate a pie chart image as a data URL for category breakdown
export const generatePieChartImage = async (
  categoryData: CategoryData[],
  width = 300,
  height = 300
): Promise<string> => {
  // Create a hidden canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Prepare data
  const labels = categoryData.map(cat => cat.name);
  const data = categoryData.map(cat => cat.value);
  const backgroundColors = categoryData.map(cat => cat.color || '#888');

  // Create chart
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      responsive: false,
      animation: false
    }
  });

  // Wait for chart to render
  await new Promise(resolve => setTimeout(resolve, 200));

  // Get image data URL
  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();
  return dataUrl;
};