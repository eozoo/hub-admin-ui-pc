<template>
  <main class="not-found">
    <div>
      <b>404</b>
      <h1>页面不存在</h1>
      <p>访问地址可能已变更或没有对应页面。</p>
      <router-link to="/">返回首页</router-link>
    </div>
  </main>
</template>
<style scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
  background: #f4f7fb;
}
.not-found b {
  font-size: 88px;
  color: #1f8da3;
}
.not-found h1 {
  color: #18304a;
}
.not-found p {
  color: #8290a2;
}
.not-found a {
  color: #168da2;
}
</style>
