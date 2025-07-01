<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="40" height="40" />

      <ul class="menu">
        <li><RouterLink to="/">Home</RouterLink></li>
        <li><RouterLink to="/links">About</RouterLink></li>
      </ul>
    </nav>
  </header>

  <RouterView />
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
  height: 2.5em;
  padding: 0.5em;
  will-change: filter;
  transition: filter 300ms;
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
