import StoreLayout from '@/components/store-layout'
import PriceListView from '@/components/PriceList/PriceListView'

export const metadata = {
  title: 'قائمة الأسعار المحدثة - الحسين للاب توب',
  description: 'جدول أسعار ومواصفات أجهزة اللابتوب المستوردة ومحطات العمل المتوفرة لدى الحسين للاب توب.',
}

export default function PriceListPage() {
  return (
    <StoreLayout>
      <PriceListView />
    </StoreLayout>
  )
}
