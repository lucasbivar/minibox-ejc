import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Cardápio "O Box" do encontro (CARDÁPIOS MINIBOX.pdf), numerado na ordem das categorias do documento.
const MENU_ITEMS: { number: number; description: string; price: number }[] = [
  // Jantar
  { number: 1, description: "Porção de Purê de Macaxeira com Carne", price: 12.0 },
  { number: 2, description: "Porção de Purê de Macaxeira com Calabresa", price: 11.0 },
  { number: 3, description: "Fatia de Pizza", price: 7.0 },
  { number: 4, description: "Cachorro-Quente", price: 9.0 },
  // Salgado
  { number: 5, description: "Fatia de Torta Salgada", price: 8.0 },
  { number: 6, description: "Combo 5 Salgadinhos", price: 8.0 },
  { number: 7, description: "Empada Grande", price: 5.0 },
  { number: 8, description: "Misto Quente", price: 4.0 },
  { number: 9, description: "Hambúrguer Artesanal", price: 18.0 },
  { number: 10, description: "Mini-Hambúrguer", price: 6.0 },
  { number: 11, description: "Sanduíche Natural", price: 5.0 },
  // Bebidas
  { number: 12, description: "Água sem Gás", price: 2.0 },
  { number: 13, description: "Água com Gás", price: 2.5 },
  { number: 14, description: "Copo de Refrigerante", price: 3.5 },
  { number: 15, description: "Copo de Suco", price: 3.5 },
  { number: 16, description: "Energético", price: 10.0 },
  { number: 17, description: "Copinho de Café", price: 1.5 },
  // Combos (acréscimos)
  { number: 18, description: "Combo + Suco", price: 3.0 },
  { number: 19, description: "Combo + Refrigerante", price: 3.0 },
  // Bomboniere
  { number: 20, description: "Trident", price: 3.0 },
  { number: 21, description: "Halls", price: 3.0 },
  { number: 22, description: "Pirulito", price: 1.0 },
  { number: 23, description: "Jujuba", price: 3.0 },
  // Camisas
  { number: 24, description: "Camisa EJC Padrão", price: 40.0 },
  // Kits de Almoço
  { number: 25, description: "Kit Almoço Normal", price: 4.0 },
  { number: 26, description: "Kit Almoço com Bebida", price: 6.0 },
  { number: 27, description: "Kit Almoço com Bebida e Sobremesa", price: 10.0 },
  // Delivery (taxas de entrega)
  { number: 28, description: "Taxa de Entrega – Térreo", price: 1.0 },
  { number: 29, description: "Taxa de Entrega – 1º Andar", price: 1.5 },
  // Kit Recepção
  { number: 30, description: "Kit Recepção (Azul, Verde, Vermelho ou Amarelo)", price: 25.0 },
  // Doces
  { number: 31, description: "1 Brigadeiro", price: 3.0 },
  { number: 32, description: "2 Brigadeiros", price: 5.0 },
  { number: 33, description: "Fatia de Torta Doce", price: 7.0 },
  { number: 34, description: "Brownie", price: 6.0 },
  { number: 35, description: "Caixinha com 4 Mini Donuts", price: 15.0 },
  { number: 36, description: "Macaron", price: 6.0 },
  { number: 37, description: "Fatia de Pudim", price: 6.0 },
  { number: 38, description: "Cremosinn", price: 3.0 },
  { number: 39, description: "Açaí Simples", price: 7.0 },
  { number: 40, description: "Açaí Completo (leite condensado, leite em pó, granola e banana)", price: 10.0 },
  // Bottons
  { number: 41, description: "Bottons (Azul, Verde, Vermelho ou Amarelo)", price: 5.0 },
];

async function main(): Promise<void> {
  for (const item of MENU_ITEMS) {
    await prisma.menuItem.create({ data: item });
  }
  console.log(`Cardápio cadastrado: ${MENU_ITEMS.length} itens.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
