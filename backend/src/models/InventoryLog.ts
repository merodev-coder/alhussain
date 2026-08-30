import mongoose, { Schema } from 'mongoose'

export type InventoryKind = 'laptop' | 'addon' | 'accessory'

export interface InventoryLogDoc {
  _id?: string
  id?: string
  itemType: InventoryKind
  itemId: string
  itemName: string
  adminUser: string
  oldQty: number
  newQty: number
  reason: string
  date: Date
  dbIndex: number
}

const InventoryLogSchema = new Schema<InventoryLogDoc>(
  {
    itemType: { type: String, enum: ['laptop', 'addon', 'accessory'], required: true },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    adminUser: { type: String, required: true },
    oldQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
    reason: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    dbIndex: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString: () => string })?.toString()
        delete ret._id
      },
    },
  }
)

InventoryLogSchema.index({ itemId: 1, date: -1 })
InventoryLogSchema.index({ date: -1 })

export function getInventoryLogModel(
  connection: mongoose.Connection
): mongoose.Model<InventoryLogDoc> {
  if (connection.models.InventoryLog) {
    return connection.models.InventoryLog as mongoose.Model<InventoryLogDoc>
  }
  return connection.model<InventoryLogDoc>('InventoryLog', InventoryLogSchema)
}

export default getInventoryLogModel(mongoose.connection)
