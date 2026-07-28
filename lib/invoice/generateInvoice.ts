import jsPDF from "jspdf";

export function generateInvoice(order: any) {
  const doc = new jsPDF();

  doc.text("INVOICE", 20, 20);
  doc.text(`Order: ${order.id}`, 20, 40);
  doc.text(`Amount: KES ${order.total}`, 20, 50);

  doc.save(`invoice-${order.id}.pdf`);
}