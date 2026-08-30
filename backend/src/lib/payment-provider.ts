/**
 * PaymentProvider abstraction.
 *
 * Path A (current): ManualPaymentProvider — customer pays Vodafone Cash / InstaPay /
 * bank transfer themselves, uploads a receipt, admin confirms in the dashboard.
 *
 * Path B (future): a PaymobPaymentProvider can implement the same interface and
 * replace confirmation with webhook-driven settlement. Do not add Paymob API
 * calls until a merchant account and keys are provided.
 */

export type PaymentMethod = 'vodafone_cash' | 'instapay' | 'bank_transfer'

export type PaymentStatus = 'pending_verification' | 'confirmed' | 'rejected'

export interface PaymentInstructions {
  method: PaymentMethod
  labelAr: string
  /** Number, handle, or account details shown to the customer. */
  destination: string
  notesAr: string
}

export interface PaymentProvider {
  readonly id: 'manual' | 'paymob'
  listMethods(): PaymentInstructions[]
  getInstructions(method: PaymentMethod): PaymentInstructions | null
}

export class ManualPaymentProvider implements PaymentProvider {
  readonly id = 'manual' as const

  listMethods(): PaymentInstructions[] {
    const methods: PaymentMethod[] = ['vodafone_cash', 'instapay', 'bank_transfer']
    return methods
      .map(m => this.getInstructions(m))
      .filter((x): x is PaymentInstructions => x !== null)
  }

  getInstructions(method: PaymentMethod): PaymentInstructions | null {
    if (method === 'vodafone_cash') {
      const destination = process.env.VODAFONE_CASH_NUMBER || ''
      return {
        method,
        labelAr: 'فودافون كاش',
        destination: destination || 'يُحدد من الإدارة',
        notesAr: 'حوّل المبلغ إلى رقم فودافون كاش ثم ارفع صورة الإيصال. الطلب يبقى قيد المراجعة حتى يؤكد المسؤول الدفع.',
      }
    }
    if (method === 'instapay') {
      const destination = process.env.INSTAPAY_HANDLE || ''
      return {
        method,
        labelAr: 'إنستا باي',
        destination: destination || 'يُحدد من الإدارة',
        notesAr: 'حوّل عبر إنستا باي إلى العنوان الظاهر ثم ارفع صورة الإيصال. التأكيد يدوي وليس فورياً.',
      }
    }
    const destination = process.env.BANK_ACCOUNT_DETAILS || ''
    return {
      method: 'bank_transfer',
      labelAr: 'تحويل بنكي',
      destination: destination || 'يُحدد من الإدارة',
      notesAr: 'حوّل المقدم إلى الحساب البنكي ثم ارفع صورة إيصال الإيداع.',
    }
  }
}

/**
 * Swap this factory when adding Path B (Paymob).
 * Example: if (process.env.PAYMOB_API_KEY) return new PaymobPaymentProvider()
 */
export function getPaymentProvider(): PaymentProvider {
  return new ManualPaymentProvider()
}
