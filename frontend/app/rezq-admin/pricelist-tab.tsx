'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { clientLogger } from '@/lib/client-logger'

export default function PricelistTab() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [uploadedPricelist, setUploadedPricelist] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.docx')) {
        setError('يجب اختيار ملف Word (.docx) فقط')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('يرجى اختيار ملف أولاً')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await api.upload_pricelist(file)
      setUploadedPricelist(result)
      setSuccess(true)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      clientLogger.error('Pricelist upload error:', err)
      setError(err instanceof Error ? err.message : 'فشل رفع قائمة الأسعار')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans font-bold text-ink text-2xl mb-2">قائمة الأسعار</h2>
        <p className="font-body text-sm text-ink-muted">
          قم برفع ملف Word (.docx) ليتم تحويله وعرضه على الموقع العام
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-canvas border border-hairline rounded-[20px] p-6">
        <label className="block">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              file
                ? 'border-brand-primary bg-brand-primary/5'
                : 'border-hairline hover:border-brand-primary hover:bg-surface-1'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-ink-muted mx-auto mb-3" />
            <p className="font-body text-sm text-ink mb-1">
              {file ? file.name : 'اسحب ملف Word أو انقر للاختيار'}
            </p>
            <p className="font-body text-xs text-ink-muted">
              تنسيق مقبول: .docx فقط
            </p>
          </div>
        </label>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={cn(
              'px-6 py-2 rounded-lg font-body font-semibold text-sm transition-colors',
              file && !loading
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                : 'bg-surface-1 text-ink-muted cursor-not-allowed'
            )}
          >
            {loading ? 'جاري الرفع...' : 'رفع قائمة الأسعار'}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-100 border border-red-300 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-body font-semibold text-red-700">خطأ</p>
            <p className="font-body text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {success && uploadedPricelist && (
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-green-100 border border-green-300 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-body font-semibold text-green-700">نجح</p>
              <p className="font-body text-sm text-green-600">
                تم نشر قائمة الأسعار بنجاح في {new Date(uploadedPricelist.uploadedAt).toLocaleString('ar-EG')}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-canvas border border-hairline rounded-[20px] p-6">
            <h3 className="font-sans font-bold text-ink mb-4">معاينة المحتوى</h3>
            <div
              className="prose prose-table:border prose-table:border-hairline prose-th:bg-surface-1 prose-th:padding prose-th:text-right prose-td:padding prose-td:text-right max-w-none overflow-auto bg-surface-1 rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: uploadedPricelist.parsedHtml }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
