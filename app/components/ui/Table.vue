<template>
    <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200" :class="body.bordered ? 'border-collapse' : ''">
            <thead class="bg-slate-50">
                <tr>
                    <th v-for="column in body.columns" :key="column.key" class="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        {{ column.label }}
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                <tr v-for="(row, index) in body.rows" :key="index" :class="body.striped && index % 2 ? 'bg-slate-50/70' : ''">
                    <td v-for="column in body.columns" :key="column.key" class="px-4 py-3 text-sm text-slate-600">
                        {{ row[column.key] }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import type { TableBody } from '~/shared/types/page-section'
defineProps<{ body: TableBody }>()
</script>
