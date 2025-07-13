<template>
  <div class="space-y-4">
    <label>
      {{ t('load3d.backgroundColor') }}
    </label>
    <input v-model="backgroundColor" type="color" class="w-full" />

    <Checkbox v-model="showGrid" input-id="showGrid" binary name="showGrid" />

    <label for="showGrid" class="pl-2">
      {{ t('load3d.showGrid') }}
    </label>
  </div>
</template>

<script setup lang="ts">
import Checkbox from 'primevue/checkbox'

import { t } from '@/i18n'

const backgroundColor = defineModel<string>('backgroundColor')
const showGrid = defineModel<boolean>('showGrid')
</script>
