<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import DragPreview from './components/DragPreview.vue'
</script>

<template>
  <header>
    <nav>
      <img alt="logo" class="logo" src="@/assets/rowan.svg" />

      <ul class="menu">
        <li><RouterLink to="/">Home</RouterLink></li>
        <li><RouterLink to="/links">About</RouterLink></li>
      </ul>
    </nav>
  </header>

  <RouterView />

  <!-- Global drag preview -->
  <DragPreview />
</template>

<style scoped>
header {
  background-color: #282c34;
  border-bottom: 3px solid #f7d87c;
  padding: 0.2rem 0 0.5rem;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2.5em 0 2em;
}

.logo {
  height: 70px;
}

.menu {
  display: flex;
  list-style: none;
  gap: 2em;
}

.menu a {
  color: #ddd;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.menu a:hover {
  color: #36958e;
  background-color: rgba(255, 255, 255, 0.1);
}

@media (max-width: 480px) {
  .menu {
    flex-direction: column;
    gap: 0.5rem;
  }

  .logo {
    height: 1.5em;
  }
}
</style>
