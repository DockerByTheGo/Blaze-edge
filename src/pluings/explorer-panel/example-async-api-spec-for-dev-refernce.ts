import type { AsyncAPIDocument } from "./src/types/asyncapi/msin";

export const exampleDoc: AsyncAPIDocument = {
  asyncapi: "3.0.0",
  info: {
    title: "Two-Channel Service API",
    version: "1.0.0",
    description: "An example service with two channels, each supporting two message types for sending and receiving.",
    contact: {
      name: "API Support",
      email: "support@example.com",
      url: "https://docs.example.com/api",
    },
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0",
    },
  },
  servers: {
    production: {
      host: "broker.example.com",
      protocol: "mqtt",
      description: "Production MQTT broker",
      security: [
        {
          $ref: "#/components/securitySchemes/apiKey",
        },
      ],
    },
    development: {
      host: "dev-broker.example.com",
      protocol: "mqtt",
      description: "Development MQTT broker",
      security: [
        {
          $ref: "#/components/securitySchemes/apiKey",
        },
      ],
    },
  },
  channels: {
    orders: {
      address: "orders",
      description: "Channel for order-related messages",
      messages: {
        orderCreated: {
          $ref: "#/components/messages/OrderCreated",
        },
        orderUpdated: {
          $ref: "#/components/messages/OrderUpdated",
        },
        processOrder: {
          $ref: "#/components/messages/ProcessOrder",
        },
        cancelOrder: {
          $ref: "#/components/messages/CancelOrder",
        },
      },
    },
    inventory: {
      address: "inventory",
      description: "Channel for inventory-related messages",
      messages: {
        inventoryUpdated: {
          $ref: "#/components/messages/InventoryUpdated",
        },
        lowStockAlert: {
          $ref: "#/components/messages/LowStockAlert",
        },
        restockItem: {
          $ref: "#/components/messages/RestockItem",
        },
        removeItem: {
          $ref: "#/components/messages/RemoveItem",
        },
      },
    },
  },
  operations: {
    receiveOrderEvents: {
      action: "receive",
      channel: {
        $ref: "#/channels/orders",
      },
      messages: [
        {
          $ref: "#/channels/orders/messages/orderCreated",
        },
        {
          $ref: "#/channels/orders/messages/orderUpdated",
        },
      ],
      summary: "Receive order-related events",
    },
    sendOrderCommands: {
      action: "send",
      channel: {
        $ref: "#/channels/orders",
      },
      messages: [
        {
          $ref: "#/channels/orders/messages/processOrder",
        },
        {
          $ref: "#/channels/orders/messages/cancelOrder",
        },
      ],
      summary: "Send order-related commands",
    },
    receiveInventoryEvents: {
      action: "receive",
      channel: {
        $ref: "#/channels/inventory",
      },
      messages: [
        {
          $ref: "#/channels/inventory/messages/inventoryUpdated",
        },
        {
          $ref: "#/channels/inventory/messages/lowStockAlert",
        },
      ],
      summary: "Receive inventory-related events",
    },
    sendInventoryCommands: {
      action: "send",
      channel: {
        $ref: "#/channels/inventory",
      },
      messages: [
        {
          $ref: "#/channels/inventory/messages/restockItem",
        },
        {
          $ref: "#/channels/inventory/messages/removeItem",
        },
      ],
      summary: "Send inventory-related commands",
    },
  },
  components: {
    messages: {
      OrderCreated: {
        name: "orderCreated",
        title: "Order Created",
        summary: "An event indicating a new order has been created",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/OrderCreatedEvent",
        },
      },
      OrderUpdated: {
        name: "orderUpdated",
        title: "Order Updated",
        summary: "An event indicating an existing order has been updated",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/OrderUpdatedEvent",
        },
      },
      ProcessOrder: {
        name: "processOrder",
        title: "Process Order",
        summary: "A command to process an order",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/ProcessOrderCommand",
        },
      },
      CancelOrder: {
        name: "cancelOrder",
        title: "Cancel Order",
        summary: "A command to cancel an order",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/CancelOrderCommand",
        },
      },
      InventoryUpdated: {
        name: "inventoryUpdated",
        title: "Inventory Updated",
        summary: "An event indicating inventory levels have changed",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/InventoryUpdatedEvent",
        },
      },
      LowStockAlert: {
        name: "lowStockAlert",
        title: "Low Stock Alert",
        summary: "An event indicating an item is running low on stock",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/LowStockAlertEvent",
        },
      },
      RestockItem: {
        name: "restockItem",
        title: "Restock Item",
        summary: "A command to restock an inventory item",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/RestockItemCommand",
        },
      },
      RemoveItem: {
        name: "removeItem",
        title: "Remove Item",
        summary: "A command to remove an item from inventory",
        contentType: "application/json",
        payload: {
          $ref: "#/components/schemas/RemoveItemCommand",
        },
      },
    },
    schemas: {
      OrderCreatedEvent: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the order",
          },
          customerId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the customer",
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/OrderItem",
            },
          },
          totalAmount: {
            type: "number",
            format: "float",
            description: "Total order amount",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "When the order was created",
          },
        },
        required: [
          "orderId",
          "customerId",
          "items",
          "totalAmount",
          "timestamp",
        ],
      },
      OrderUpdatedEvent: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the order",
          },
          status: {
            type: "string",
            enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"],
            description: "Current status of the order",
          },
          updatedItems: {
            type: "array",
            items: {
              $ref: "#/components/schemas/OrderItem",
            },
          },
          totalAmount: {
            type: "number",
            format: "float",
            description: "Updated total order amount",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "When the order was updated",
          },
        },
        required: ["orderId", "status", "timestamp"],
      },
      ProcessOrderCommand: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the order to process",
          },
          priority: {
            type: "string",
            enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
            default: "NORMAL",
            description: "Processing priority level",
          },
        },
        required: ["orderId"],
      },
      CancelOrderCommand: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the order to cancel",
          },
          reason: {
            type: "string",
            description: "Reason for cancellation",
          },
          refundRequested: {
            type: "boolean",
            default: false,
            description: "Whether a refund was requested",
          },
        },
        required: ["orderId"],
      },
      InventoryUpdatedEvent: {
        type: "object",
        properties: {
          itemId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the inventory item",
          },
          name: {
            type: "string",
            description: "Name of the item",
          },
          previousQuantity: {
            type: "integer",
            description: "Previous quantity in stock",
          },
          currentQuantity: {
            type: "integer",
            description: "Current quantity in stock",
          },
          locationId: {
            type: "string",
            description: "Warehouse or location identifier",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "When the inventory was updated",
          },
        },
        required: ["itemId", "currentQuantity", "timestamp"],
      },
      LowStockAlertEvent: {
        type: "object",
        properties: {
          itemId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the inventory item",
          },
          name: {
            type: "string",
            description: "Name of the item",
          },
          currentQuantity: {
            type: "integer",
            description: "Current quantity in stock",
          },
          thresholdQuantity: {
            type: "integer",
            description: "Threshold that triggered the alert",
          },
          locationId: {
            type: "string",
            description: "Warehouse or location identifier",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "When the alert was generated",
          },
        },
        required: [
          "itemId",
          "currentQuantity",
          "thresholdQuantity",
          "timestamp",
        ],
      },
      RestockItemCommand: {
        type: "object",
        properties: {
          itemId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the inventory item",
          },
          quantity: {
            type: "integer",
            minimum: 1,
            description: "Quantity to add to inventory",
          },
          locationId: {
            type: "string",
            description: "Warehouse or location identifier",
          },
          expectedDeliveryDate: {
            type: "string",
            format: "date",
            description: "Expected date of restock delivery",
          },
        },
        required: ["itemId", "quantity"],
      },
      RemoveItemCommand: {
        type: "object",
        properties: {
          itemId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the inventory item",
          },
          quantity: {
            type: "integer",
            minimum: 1,
            description: "Quantity to remove from inventory",
          },
          locationId: {
            type: "string",
            description: "Warehouse or location identifier",
          },
          reason: {
            type: "string",
            enum: ["SOLD", "DAMAGED", "EXPIRED", "TRANSFERRED"],
            description: "Reason for removal",
          },
        },
        required: ["itemId", "quantity", "reason"],
      },
      OrderItem: {
        type: "object",
        properties: {
          itemId: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the item",
          },
          name: {
            type: "string",
            description: "Name of the item",
          },
          quantity: {
            type: "integer",
            minimum: 1,
            description: "Quantity ordered",
          },
          unitPrice: {
            type: "number",
            format: "float",
            description: "Price per unit",
          },
        },
        required: ["itemId", "quantity", "unitPrice"],
      },
    },
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key for authentication",
      },
    },
  },
};
