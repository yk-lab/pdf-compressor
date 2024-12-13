<script setup lang="ts">
import SiteHeader from './components/SiteHeader.vue';
import MainArea from './components/MainArea.vue';
import HowToArea from './components/HowToArea.vue';
import NotesArea from './components/NotesArea.vue';
</script>

<template>
  <div class="px-6 lg:px-8 py-24 sm:py-32">
    <header>
      <SiteHeader />
    </header>
    <main class="mt-16">
      <MainArea />
    </main>
    <HowToArea />
    <NotesArea />
  </div>
</template>
