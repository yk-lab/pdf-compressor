import { useDateFormat, useNow } from '@vueuse/core'
import type { Ref } from 'vue'

export const getGeneratedPDFOutputFileName = (datetime: Ref<Date> | Date | undefined = undefined) => {
  const formatted = useDateFormat(datetime || useNow(), 'YYYYMMDD_HHmmss')
  return `${formatted.value}.pdf`
}
