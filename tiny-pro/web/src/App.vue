<template>
  <div>
    <router-view />
    <global-setting />
  </div>
</template>

<script lang="ts" setup>
  import { provide } from 'vue';
  import * as echarts from 'echarts';
  import GlobalSetting from '@/components/global-setting/index.vue';
  import TinyThemeTool from '@opentiny/vue-theme/theme-tool';
  import { useTheme } from './hooks/useTheme';

  provide('echarts', echarts);
  const theme = new TinyThemeTool();
  useTheme(theme);
</script>

<style lang="less" scoped>
  @import '@/assets/style/menu.less'; /* 引入公共样式 */
</style>
