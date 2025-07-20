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
  padding: 1rem 0;
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
  height: 50px;
}

.menu {
  display: flex;
  list-style: none;
  gap: 2em;
}

.menu a {
  color: #ddd;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.menu a:hover {
  color: #36958e;
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
