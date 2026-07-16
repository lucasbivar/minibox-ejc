import { PAYMENT_CONDITION_LABELS, PAYMENT_METHOD_LABELS } from "@minibox/shared";
import type { OrderDto } from "@minibox/shared";
import { jsPDF } from "jspdf";
import { formatCurrency, formatDateTime } from "./format";

const PAGE_MARGIN = 15;
const PAGE_WIDTH = 210;
const COLUMN_X = { description: PAGE_MARGIN, quantity: 130, unitPrice: 150, subtotal: 180 };

function drawHeader(doc: jsPDF, order: OrderDto, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MINIBOX EJC", PAGE_MARGIN, y);
  doc.setFontSize(11);
  doc.text(`Pedido nº ${order.orderNumber}`, PAGE_MARGIN, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Comprovante de pedido", PAGE_WIDTH - PAGE_MARGIN, y, { align: "right" });
  doc.text(formatDateTime(order.dateTime), PAGE_WIDTH - PAGE_MARGIN, y + 7, { align: "right" });

  return y + 14;
}

function drawInfoRow(doc: jsPDF, label: string, value: string, y: number): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(label, PAGE_MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, PAGE_MARGIN + 28, y);
}

function drawParticipantInfo(doc: jsPDF, order: OrderDto, y: number): number {
  drawInfoRow(doc, "Participante:", order.participantName, y);
  drawInfoRow(doc, "Número:", order.participantPhone ?? "—", y + 6);
  drawInfoRow(doc, "Equipe:", order.teamName, y + 12);

  const conditionLabel = PAYMENT_CONDITION_LABELS[order.condition];
  const conditionValue = order.paymentMethod
    ? `${conditionLabel} (${PAYMENT_METHOD_LABELS[order.paymentMethod]})`
    : conditionLabel;
  drawInfoRow(doc, "Condição:", conditionValue, y + 18);

  return y + 26;
}

function drawTableHeader(doc: jsPDF, y: number): number {
  doc.setDrawColor(180);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Item", COLUMN_X.description, y + 6);
  doc.text("Qtd.", COLUMN_X.quantity, y + 6, { align: "right" });
  doc.text("Valor un.", COLUMN_X.unitPrice, y + 6, { align: "right" });
  doc.text("Subtotal", COLUMN_X.subtotal, y + 6, { align: "right" });

  doc.line(PAGE_MARGIN, y + 8, PAGE_WIDTH - PAGE_MARGIN, y + 8);
  return y + 14;
}

function drawItemRow(doc: jsPDF, item: OrderDto["items"][number], y: number): void {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(item.description, COLUMN_X.description, y, { maxWidth: COLUMN_X.quantity - COLUMN_X.description - 4 });
  doc.text(String(item.quantity), COLUMN_X.quantity, y, { align: "right" });
  doc.text(formatCurrency(item.unitPrice), COLUMN_X.unitPrice, y, { align: "right" });
  doc.text(formatCurrency(item.subtotal), COLUMN_X.subtotal, y, { align: "right" });
}

const PAGE_HEIGHT = 297;
const FOOTER_RESERVED_HEIGHT = 20;

export function downloadOrderReceipt(order: OrderDto): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = PAGE_MARGIN;
  y = drawHeader(doc, order, y);
  y = drawParticipantInfo(doc, order, y);
  y = drawTableHeader(doc, y);

  for (const item of order.items) {
    if (y > PAGE_HEIGHT - FOOTER_RESERVED_HEIGHT) {
      doc.addPage();
      y = PAGE_MARGIN;
      y = drawTableHeader(doc, y);
    }
    drawItemRow(doc, item, y);
    y += 7;
  }

  doc.setDrawColor(180);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", COLUMN_X.unitPrice, y, { align: "right" });
  doc.text(formatCurrency(order.totalAmount), COLUMN_X.subtotal, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text("Obrigado por participar do Minibox EJC!", PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });

  doc.save(`pedido-${order.orderNumber}.pdf`);
}
