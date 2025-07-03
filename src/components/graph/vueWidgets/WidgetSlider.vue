<template>
  <div class="flex items-center justify-between gap-2 w-full">
    <label v-if="widget.name" class="text-sm opacity-80 whitespace-nowrap">{{
      widget.name
    }}</label>
    <Slider
      v-model="value"
      v-bind="filteredProps"
      :disabled="readonly"
      class="flex-1 max-w-[300px]"
    />
  </div>
</template>

<script setup lang="ts">
import Slider from 'primevue/slider'
import { computed } from 'vue'

import type { SimplifiedWidget } from '@/types/simplifiedWidget'
import {
  STANDARD_EXCLUDED_PROPS,
  filterWidgetProps
} from '@/utils/widgetPropFilter'

const value = defineModel<number>({ required: true })

const props = defineProps<{
  widget: SimplifiedWidget<number>
  readonly?: boolean
}>()

const filteredProps = computed(() =>
  filterWidgetProps(props.widget.options, STANDARD_EXCLUDED_PROPS)
)
</script>
