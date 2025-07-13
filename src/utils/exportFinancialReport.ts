import { jsPDF } from './pdfUtils';
import { formatCurrency } from './calculations';
import { getBankById } from './banks';
import Chart from 'chart.js/auto';
import { defaultExpenseCategories } from './categories';
import { startOfYear, endOfYear, eachMonthOfInterval, format, startOfMonth, parseISO, isAfter, isSameMonth, endOfMonth, isWithinInterval } from 'date-fns';

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

// Helper function to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ];
  }
  return [136, 136, 136]; // Default gray color
}

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
    head: [['Month', 'Income', 'Expenses', 'Savings', 'Rate', 'Includes Initial Balance?']],
    body: monthlyData.map(m => [
      { content: String(m.month), styles: { fontStyle: 'bold' } },
      formatCurrency(m.income),
      formatCurrency(m.expenses),
      formatCurrency(m.savings),
      `${m.savingsRate?.toFixed(1) ?? '0.0'}%`,
      m.includesInitialBalance ? 'Yes' : 'No'
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

// Helper function for autoTable with logo
const autoTableOptsWithLogo = (doc: any, logoImageBase64: string) => (opts: any) => ({
  ...opts,
  didDrawPage: (data: any) => {
    addLogoToPage(doc, logoImageBase64);
    if (opts.didDrawPage) opts.didDrawPage(data);
  }
});

// --- Helper: Per-Account Category Breakdown ---
async function addAccountCategoryBreakdowns(doc: any, y: number, accountCategoryBreakdowns: any[], logoImageBase64: string): Promise<number> {
  const autoTableOpts = autoTableOptsWithLogo(doc, logoImageBase64);
  
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
      y = (doc as any).autoTable(autoTableOpts({
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

// Update addWatermark to tile the watermark text across the page
const addWatermark = (doc: any) => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const watermarkText = 'ExpenseTracker';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(180, 180, 180); // a bit darker
    const angle = -30;
    const stepX = 100;
    const stepY = 60;
    for (let x = -pageWidth; x < pageWidth * 2; x += stepX) {
      for (let y = 0; y < pageHeight * 2; y += stepY) {
        if (doc.saveGraphicsState) doc.saveGraphicsState();
        if (doc.setGState) doc.setGState(new doc.GState({ opacity: 0.14 }));
        doc.text(watermarkText, x, y, { angle });
        if (doc.restoreGraphicsState) doc.restoreGraphicsState();
      }
    }
    doc.setTextColor(0, 0, 0); // Reset color
  }
};

// --- Add a solid blackish grey border to every page ---
function addPdfBorder(doc: any) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(3);
    doc.rect(5, 5, doc.internal.pageSize.getWidth() - 10, doc.internal.pageSize.getHeight() - 10, 'S');
  }
}

// --- Helper: Budgets Section ---
function addBudgetsSection(doc: any, y: number, budgets: any[], expenses: any[], bankAccountId: string): number {
  if (!budgets || budgets.length === 0) return y;
  
  // Budgets are already filtered by bank account, so use them directly
  const accountBudgets = budgets;
  if (accountBudgets.length === 0) return y;
  
  // Filter expenses for this bank account (if expenses are provided)
  const accountExpenses = expenses.filter(expense => expense.bankAccountId === bankAccountId);
  
  console.log(`📊 Budget Section - bankAccountId: ${bankAccountId}`);
  console.log(`📊 Budget Section - Total expenses: ${expenses.length}`);
  console.log(`📊 Budget Section - Filtered expenses: ${accountExpenses.length}`);
  console.log(`📊 Budget Section - Budgets count: ${accountBudgets.length}`);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(139, 69, 19); // Brown color for budgets
  doc.text('Budget Management', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  
  // Helper function to calculate category expenses for a specific period (monthly/yearly)
  const calculateCategoryExpensesForPeriod = (expenses: any[], category: string, period: 'monthly' | 'yearly', date: Date = new Date()): number => {
    if (period === 'monthly') {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      return expenses
        .filter(expense => expense.category === category)
        .reduce((total, expense) => {
          const expenseDate = parseISO(expense.date);
          
          // Include recurring monthly expenses for this category
          if (expense.isRecurring && expense.frequency === 'monthly') {
            return total + expense.amount;
          } 
          // Include yearly expenses (divided by 12) for this category
          else if (expense.isRecurring && expense.frequency === 'yearly') {
            return total + (expense.amount / 12);
          } 
          // Include ALL one-time expenses in this category for the current month
          else if (!expense.isRecurring && 
                   isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })) {
            return total + expense.amount;
          }
          
          return total;
        }, 0);
    } else {
      // For yearly budgets, calculate the entire year
      const yearStart = startOfYear(date);
      const yearEnd = endOfYear(date);

      return expenses
        .filter(expense => expense.category === category)
        .reduce((total, expense) => {
          const expenseDate = parseISO(expense.date);
          
          // Include recurring monthly expenses for this category (multiply by 12 for yearly)
          if (expense.isRecurring && expense.frequency === 'monthly') {
            return total + (expense.amount * 12);
          } 
          // Include yearly expenses for this category
          else if (expense.isRecurring && expense.frequency === 'yearly') {
            return total + expense.amount;
          } 
          // Include ALL one-time expenses in this category for the current year
          else if (!expense.isRecurring && 
                   isWithinInterval(expenseDate, { start: yearStart, end: yearEnd })) {
            return total + expense.amount;
          }
          
          return total;
        }, 0);
    }
  };
  
  // Calculate budget progress for each budget
  const budgetData = accountBudgets.map(budget => {
    // Use the same calculation logic as the main app, but handle both monthly and yearly periods
    const categoryExpenses = calculateCategoryExpensesForPeriod(accountExpenses, budget.category, budget.period, new Date());
    const progress = budget.budgetAmount > 0 ? (categoryExpenses / budget.budgetAmount) * 100 : 0;
    const remaining = budget.budgetAmount - categoryExpenses;
    
    console.log(`📊 PDF Budget Calculation for ${budget.category}:`, {
      budgetAmount: budget.budgetAmount,
      period: budget.period,
      totalExpenses: accountExpenses.length,
      categoryExpenses: categoryExpenses,
      progress: progress,
      remaining: remaining,
      bankAccountId: bankAccountId
    });
    
    return {
      category: budget.category,
      budgetAmount: budget.budgetAmount,
      spent: categoryExpenses,
      remaining: remaining,
      progress: progress,
      status: progress >= 100 ? 'Over Budget !' : progress >= budget.alertThreshold ? 'Warning' : 'On Track'
    };
  });
  
  (doc as any).autoTable({
    startY: y,
    head: [['Category', 'Budget', 'Spent', 'Remaining', 'Progress', 'Status']],
    body: budgetData.map(b => [
      b.category,
      formatCurrency(b.budgetAmount),
      formatCurrency(b.spent),
      formatCurrency(b.remaining),
      `${b.progress.toFixed(1)}%`,
      b.status
    ]),
    headStyles: { fillColor: [139, 69, 19], textColor: 255 },
    styles: { fontSize: 9, font: 'helvetica' },
    theme: 'grid',
    margin: { left: 15, right: 15 }
  });
  
  return (doc as any).lastAutoTable.finalY + 15;
}

// --- Helper: Savings Goals Section ---
function addSavingsGoalsSection(doc: any, y: number, goals: any[], bankAccountId: string): number {
  if (!goals || goals.length === 0) return y;
  
  // Goals are global - show all goals for all accounts
  const allGoals = goals;
  if (allGoals.length === 0) return y;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(34, 139, 34); // Green color for goals
  doc.text('Savings Goals', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  
  // Calculate goal progress for each goal
  const goalData = allGoals.map(goal => {
    const actualSavings = Math.max(goal.currentAmount, goal.autoTrackedAmount || 0);
    const progress = goal.targetAmount > 0 ? (actualSavings / goal.targetAmount) * 100 : 0;
    const remaining = goal.targetAmount - actualSavings;
    const daysRemaining = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    console.log(`📊 PDF Goal Calculation for ${goal.title}:`, {
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      autoTrackedAmount: goal.autoTrackedAmount,
      actualSavings: actualSavings,
      progress: progress,
      remaining: remaining,
      daysRemaining: daysRemaining
    });
    
    return {
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: actualSavings,
      remaining: remaining,
      progress: progress,
      targetDate: goal.targetDate,
      daysRemaining: daysRemaining,
      status: daysRemaining < 0 ? 'Overdue' : progress >= 100 ? 'Achieved' : 'In Progress'
    };
  });
  
  (doc as any).autoTable({
    startY: y,
    head: [['Goal', 'Target', 'Current', 'Remaining', 'Progress', 'Due Date', 'Status']],
    body: goalData.map(g => [
      g.title,
      formatCurrency(g.targetAmount),
      formatCurrency(g.currentAmount),
      formatCurrency(g.remaining),
      `${g.progress.toFixed(1)}%`,
      new Date(g.targetDate).toLocaleDateString(),
      g.status
    ]),
    headStyles: { fillColor: [34, 139, 34], textColor: 255 },
    styles: { fontSize: 9, font: 'helvetica' },
    theme: 'grid',
    margin: { left: 15, right: 15 }
  });
  
  return (doc as any).lastAutoTable.finalY + 15;
}

// --- Main Export Function ---
export const exportFinancialReport = async (
  user: UserData,
  bankAccounts: BankAccountData[],
  monthlyData: MonthlyData[],
  selectedYear: number,
  categoryData?: CategoryData[],
  accountCategoryBreakdowns?: any[],
  budgets?: any[],
  goals?: any[],
  expenses?: any[]
) => {
  try {
    let logoImageBase64 = '';
    try {
      logoImageBase64 = await loadImageAsBase64('/logo.png');
    } catch (e) {
      console.warn('Logo image could not be loaded for PDF, continuing without logo.');
    }
    const doc = new jsPDF();
    addLogoToPage(doc, logoImageBase64);
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

    // Create autoTable options with logo
    const autoTableOpts = autoTableOptsWithLogo(doc, logoImageBase64);

    // Add subheading for single account report
    if (!accountCategoryBreakdowns || accountCategoryBreakdowns.length === 0) {
      const acc = bankAccounts[0];
      let subheading = `Report of ${acc.bankName}`;
      if (acc.nickname) {
        subheading += ` (${acc.nickname})`;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(30, 64, 175);
      doc.text(subheading, 15, y);
      y += 10;
    }

    // If accountCategoryBreakdowns is provided, generate a section for each account
    if (accountCategoryBreakdowns && accountCategoryBreakdowns.length > 0) {
      for (let i = 0; i < accountCategoryBreakdowns.length; i++) {
        const acc = accountCategoryBreakdowns[i];
        if (i > 0) doc.addPage();
        y = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.text(`Bank Account: ${acc.nickname ? acc.nickname + ' (' + acc.bankName + ')' : acc.bankName}`, 15, y);
        y += 10;
        // Monthly Analysis
        y = (doc as any).autoTable(autoTableOpts({
          startY: getSafeStartY(doc, y),
          head: [['Month', 'Income', 'Expenses', 'Savings', 'Includes Initial Balance?']],
          body: acc.monthlyData.map((m: any) => [
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
                  // Category Breakdown and Pie Chart
          if (acc.categoryData && acc.categoryData.length > 0) {
            y = (doc as any).autoTable(autoTableOpts({
              startY: getSafeStartY(doc, y),
              head: [['Category', 'Amount', 'Percentage']],
              body: acc.categoryData.map((c: any) => [
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
          // Pie chart (reuse the same logic as before)
          try {
            const pieChartImage = await generatePieChartImage(acc.categoryData, 300, 300);
            const chartHeight = 80;
            const chartWidth = 80;
            const chartX = 20;
            const legendX = chartX + chartWidth + 20;
            y = ensureSpace(doc, y, chartHeight + 20, logoImageBase64);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(255, 99, 132);
            doc.text('Expense Category Breakdown', 20, y);
            y += 10;
            doc.addImage(pieChartImage, 'PNG', chartX, y, chartWidth, chartHeight);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            let legendY = y;
            acc.categoryData.forEach((category: any, index: number) => {
              doc.setFillColor(...hexToRgb(category.color || '#888'));
              doc.rect(legendX, legendY + 2, 6, 6, 'F');
              doc.setTextColor(0, 0, 0);
              const text = `${category.name} - ${(category.percentage || 0).toFixed(1)}%`;
              doc.text(text, legendX + 10, legendY + 7);
              doc.setFontSize(7);
              doc.setTextColor(100, 100, 100);
              doc.text(formatCurrency(category.value), legendX + 10, legendY + 13);
              doc.setFontSize(8);
              legendY += 14;
            });
            const legendHeight = acc.categoryData.length * 14;
            const pieLegendBlockHeight = Math.max(chartHeight, legendHeight);
            y += pieLegendBlockHeight + 20;

            // Add Budgets Section - filter budgets by this account
            y = ensureSpace(doc, y, 50, logoImageBase64);
            const accountBudgets = budgets ? budgets.filter(b => b.bankAccountId === acc.bankAccountId) : [];
            y = addBudgetsSection(doc, y, accountBudgets, expenses || [], acc.bankAccountId || acc.bankName);
            
            // Add Savings Goals Section (global for all accounts)
            y = ensureSpace(doc, y, 50, logoImageBase64);
            y = addSavingsGoalsSection(doc, y, goals || [], '');
            
            // Now force the summary to a new page
            doc.addPage();
            y = 20;
            y = addSummaryBlock(doc, y, bankAccounts);
          } catch (error) {
            console.error('Pie chart error:', error);
          }
        }
      }
          // Add watermark to every page before saving
    addWatermark(doc);
    addPdfBorder(doc);
    const fileName = `Financial_Report_AllAccounts_${Date.now()}.pdf`;
    doc.save(fileName);
    
    // Show success message for mobile users
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      // For mobile devices, show a custom alert
      setTimeout(() => {
        const successMessage = `PDF downloaded successfully!\n\nFile: ${fileName}\n\nCheck your Downloads folder.`;
        alert(successMessage);
      }, 500);
    }
    return;
    }

    // Bank Summary
    y = (doc as any).autoTable(autoTableOpts({
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
    y = (doc as any).autoTable(autoTableOpts({
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
      // Add category breakdown table
      y = (doc as any).autoTable(autoTableOpts({
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

      // Add pie chart image with legend
      try {
        console.log('📊 Generating pie chart for PDF...');
        const pieChartImage = await generatePieChartImage(categoryData, 300, 300);
        
        // Display at small size in PDF
        const chartHeight = 80; // Display size
        const chartWidth = 80;  // Display size
        const pageWidth = doc.internal.pageSize.getWidth();
        const chartX = 20; // Left side
        const legendX = chartX + chartWidth + 20; // Right side of chart
        
        // Ensure we have enough space
        y = ensureSpace(doc, y, chartHeight + 20, logoImageBase64);
        
        // Add chart title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 99, 132);
        doc.text('Expense Category Breakdown', 20, y);
        y += 10;
        
        doc.addImage(pieChartImage, 'PNG', chartX, y, chartWidth, chartHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        let legendY = y;
        categoryData.forEach((category, index) => {
          doc.setFillColor(...hexToRgb(category.color || '#888'));
          doc.rect(legendX, legendY + 2, 6, 6, 'F');
          doc.setTextColor(0, 0, 0);
          const text = `${category.name} - ${(category.percentage || 0).toFixed(1)}%`;
          doc.text(text, legendX + 10, legendY + 7);
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(formatCurrency(category.value), legendX + 10, legendY + 13);
          doc.setFontSize(8);
          legendY += 14;
        });
        const legendHeight = categoryData.length * 14;
        const pieLegendBlockHeight = Math.max(chartHeight, legendHeight);
        y += pieLegendBlockHeight + 20;
        
        console.log('📊 Pie chart with legend added to PDF successfully');
      } catch (error) {
        console.error('📊 Error adding pie chart to PDF:', error);
        // Continue without the chart if there's an error
      }
    }

    // Per-Account Category Breakdown
    if (accountCategoryBreakdowns && accountCategoryBreakdowns.length > 0) {
      y = await addAccountCategoryBreakdowns(doc, y, accountCategoryBreakdowns, logoImageBase64);
    }

    // Add Budgets Section (for single account reports, budgets are already filtered)
    if (bankAccounts.length > 0) {
      y = ensureSpace(doc, y, 50, logoImageBase64);
      // For single account reports, we need to get the actual bank account ID
      // Since we don't have the ID in BankAccountData, we need to find it from the budgets
      const singleAccountBudgets = budgets || [];
      let bankAccountId = '';
      
      // Try to get the bank account ID from the first budget
      if (singleAccountBudgets.length > 0 && singleAccountBudgets[0].bankAccountId) {
        bankAccountId = singleAccountBudgets[0].bankAccountId;
      } else {
        // Fallback: try to find the bank account ID from expenses
        const firstExpense = expenses?.find(e => e.bankAccountId);
        if (firstExpense) {
          bankAccountId = firstExpense.bankAccountId;
        } else {
          // Last resort: use bank name (this might not work for expense filtering)
          bankAccountId = bankAccounts[0].bankName;
        }
      }
      
      console.log(`📊 Single Account PDF - Using bankAccountId: ${bankAccountId}`);
      y = addBudgetsSection(doc, y, singleAccountBudgets, expenses || [], bankAccountId);
      
      // Add Savings Goals Section (global for all accounts)
      y = ensureSpace(doc, y, 50, logoImageBase64);
      y = addSavingsGoalsSection(doc, y, goals || [], '');
    }
    
    // Ensure space for summary block
    y = ensureSpace(doc, y, 40, logoImageBase64);
    // Summary Block
    y = addSummaryBlock(doc, y, bankAccounts);

    // Add watermark to every page before saving
    addWatermark(doc);
    addPdfBorder(doc);

    const fileName = `Financial_Report_${Date.now()}.pdf`;
    doc.save(fileName);
    
    // Show success message for mobile users
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      // For mobile devices, show a custom alert
      setTimeout(() => {
        const successMessage = `PDF downloaded successfully!\n\nFile: ${fileName}\n\nCheck your Downloads folder.`;
        alert(successMessage);
      }, 500);
    }
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

// Utility to prepare all report data for exportFinancialReport
export function prepareFinancialReportData({
  bankAccounts,
  incomes,
  expenses,
  selectedBankAccount,
  selectedYear
}: {
  bankAccounts: any[],
  incomes: any[],
  expenses: any[],
  selectedBankAccount: any,
  selectedYear: number
}) {
  // Calculate per-bank account analysis
  const bankAccountAnalysis = bankAccounts.map(account => {
    // Get incomes and expenses for this specific account
    const accountIncomes = incomes.filter(income => income.bankAccountId === account.id);
    const accountExpenses = expenses.filter(expense => expense.bankAccountId === account.id);

    // Use DB value for totalIncome only
    const totalIncome = account.totalIncome;
    const startingBalance = account.startingBalance;
    const effectiveIncome = totalIncome > 0 ? totalIncome : startingBalance;
    const currentBalance = effectiveIncome - account.totalExpense;
    const monthlySavings = currentBalance;
    const savingsRate = effectiveIncome > 0 ? (monthlySavings / effectiveIncome) * 100 : 0;

    return {
      account,
      initialBalance: startingBalance,
      totalIncome,
      totalAvailable: effectiveIncome,
      totalExpense: account.totalExpense,
      currentBalance,
      monthlySavings,
      savingsRate,
      transactionCount: accountIncomes.length + accountExpenses.length
    };
  });

  // Generate monthly data for selected year and selected bank account
  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const currentDate = new Date();

  const monthlyData = months.map(month => {
    // Only show data for months not in the future
    if (isAfter(month, endOfMonth(currentDate))) {
      return {
        month: format(month, 'MMM'),
        income: 0,
        expenses: 0,
        savings: 0,
        savingsRate: 0,
        includesInitialBalance: false
      };
    }
    
    // Filter incomes and expenses for selected bank account and month
    const monthIncomes = selectedBankAccount 
      ? incomes.filter(income => 
          income.bankAccountId === selectedBankAccount.id &&
          isSameMonth(parseISO(income.date), month)
        )
      : [];
    
    const monthExpenses = selectedBankAccount 
      ? expenses.filter(expense => 
          expense.bankAccountId === selectedBankAccount.id &&
          isSameMonth(parseISO(expense.date), month)
        )
      : [];
    
    const monthIncome = monthIncomes.reduce((sum, income) => sum + income.amount, 0);
    const monthExpense = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    let finalIncome = monthIncome;
    let finalSavings = monthIncome - monthExpense;
    let includesInitialBalance = false;
    
    // Add initial balance to the month when the account was created
    if (selectedBankAccount) {
      const accountCreationDate = parseISO(selectedBankAccount.createdAt);
      const accountCreationMonth = startOfMonth(accountCreationDate);
      
      // If this month is the account creation month, add the initial balance
      if (isSameMonth(month, accountCreationMonth)) {
        finalIncome = monthIncome + selectedBankAccount.startingBalance;
        finalSavings = finalIncome - monthExpense;
        includesInitialBalance = true;
      }
    }
    
    return {
      month: format(month, 'MMM'),
      income: finalIncome,
      expenses: monthExpense,
      savings: finalSavings,
      savingsRate: finalIncome > 0 ? (finalSavings / finalIncome) * 100 : 0,
      includesInitialBalance
    };
  });

  // Category-wise expense data for selected bank account
  const categoryData = defaultExpenseCategories.map(category => {
    const categoryExpenses = selectedBankAccount 
      ? expenses
          .filter(expense => 
            expense.bankAccountId === selectedBankAccount.id &&
            expense.category === category.id
          )
          .reduce((sum, expense) => sum + expense.amount, 0)
      : 0;
    
    return {
      name: category.name,
      value: categoryExpenses,
      color: category.color
    };
  }).filter(item => item.value > 0);

  // Per-account category breakdowns
  const accountCategoryBreakdowns = bankAccounts.map(account => {
    const totalExpense = expenses
      .filter(expense => expense.bankAccountId === account.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const categoryData = defaultExpenseCategories.map(category => {
      const categoryExpenses = expenses
        .filter(expense => expense.bankAccountId === account.id && expense.category === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const percentage = totalExpense > 0 ? (categoryExpenses / totalExpense) * 100 : 0;
      return {
        name: category.name,
        value: categoryExpenses,
        color: category.color,
        percentage
      };
    }).filter(item => item.value > 0);
    return {
      bankAccountId: account.id,
      bankName: account.bankName,
      nickname: account.nickname,
      categoryData
    };
  });

  return {
    bankAccountAnalysis,
    monthlyData,
    categoryData,
    accountCategoryBreakdowns
  };
}
