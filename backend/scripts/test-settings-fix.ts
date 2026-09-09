import { z } from 'zod'

// Test the validation schema
const settingsSchema = z.object({
  vodafoneCashNumber: z.string().min(1, 'Vodafone Cash number is required'),
  instapayNumber: z.string().min(1, 'Instapay number is required'),
  activeUploadThingTokenIndex: z.number().int().min(0).optional(),
  senderEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  senderEmailAppPassword: z.string().optional().or(z.literal('')),
})

// Test cases
const testCases = [
  {
    name: 'Valid settings',
    data: {
      vodafoneCashNumber: '01012345678',
      instapayNumber: 'instapay@user',
      activeUploadThingTokenIndex: 0,
      senderEmail: 'test@example.com',
      senderEmailAppPassword: 'password',
    },
    shouldPass: true,
  },
  {
    name: 'Empty Vodafone number',
    data: {
      vodafoneCashNumber: '',
      instapayNumber: 'instapay@user',
    },
    shouldPass: false,
  },
  {
    name: 'Empty Instapay number',
    data: {
      vodafoneCashNumber: '01012345678',
      instapayNumber: '',
    },
    shouldPass: false,
  },
  {
    name: 'Invalid email format',
    data: {
      vodafoneCashNumber: '01012345678',
      instapayNumber: 'instapay@user',
      senderEmail: 'invalid-email',
    },
    shouldPass: false,
  },
  {
    name: 'Valid with empty optional fields',
    data: {
      vodafoneCashNumber: '01012345678',
      instapayNumber: 'instapay@user',
      senderEmail: '',
      senderEmailAppPassword: '',
    },
    shouldPass: true,
  },
]

console.log('Testing settings validation schema...\n')

testCases.forEach((testCase) => {
  try {
    const result = settingsSchema.parse(testCase.data)
    if (testCase.shouldPass) {
      console.log(`✅ ${testCase.name}: PASSED`)
      console.log(`   Data:`, result)
    } else {
      console.log(`❌ ${testCase.name}: FAILED (should have failed but passed)`)
    }
  } catch (error) {
    if (!testCase.shouldPass) {
      console.log(`✅ ${testCase.name}: PASSED (correctly failed)`)
      if (error instanceof z.ZodError) {
        console.log(`   Error:`, error.issues[0].message)
      }
    } else {
      console.log(`❌ ${testCase.name}: FAILED (should have passed but failed)`)
      if (error instanceof z.ZodError) {
        console.log(`   Error:`, error.issues)
      }
    }
  }
  console.log()
})

console.log('Settings validation tests completed.')