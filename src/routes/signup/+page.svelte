<!--
   Disclaimer: Property of origins ltd. united kingdom.
   privacy policy: https://www.origins-software.com/privacy
   terms of service: https://www.origins-software.com/terms
-->
<script lang="ts">
  import { enhance } from '$app/forms';
  export let form;
  let submitting = false;
</script>

<svelte:head><title>Create account — Origins Talent</title></svelte:head>

<div class="auth-shell">
  <div class="auth-glow"></div>

  <section class="auth-brand">
    <a href="/" class="brand">
      <img src="/images/origins-logo.png" alt="Origins" />
      <span>ORIGINS<small>TALENT</small></span>
    </a>

    <div class="brand-copy">
      <span>SECURE TALENT ACCESS</span>
      <h1>One identity. The right workspace.</h1>
      <p>Applicants see their own applications. HR sees the recruiting workspace assigned to their authenticated role.</p>
    </div>

    <div class="trust">No demo records · No role switching · Supabase Auth</div>
  </section>

  <section class="auth-card">
    <span class="eyebrow">CREATE ACCOUNT</span>
    <h2>Get started</h2>
    <p class="sub">Create your free candidate account to apply and track your progress.</p>

    {#if form?.error}
      <div class="error" role="alert">{form.error}</div>
    {/if}

    <form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}>
      <label for="signup-name">
        Full name
        <input id="signup-name" name="fullName" autocomplete="name" required value={form?.fullName ?? ''} />
      </label>

      <label for="signup-email">
        Email
        <input id="signup-email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
      </label>

      <label for="signup-password">
        Password
        <input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required />
      </label>

      <button class="primary" type="submit" disabled={submitting} aria-busy={submitting}>{#if submitting}<span class="loading-spinner" aria-hidden="true"></span>Creating account…{:else}Create applicant account{/if}</button>
    </form>

    <div class="links">
      <span>Already have an account?</span>
      <a href="/login">Sign in</a>
    </div>
  </section>
</div>
