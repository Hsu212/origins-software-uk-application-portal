
<script lang="ts">
  import './careers.css';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let query = '';
  let location = '';
  let type = 'All types';
  let sort = 'newest';
  let selected: string | null = null;
  let saved: string[] = [];
  let mobileDetails = false;

  $: employmentTypes = [
    ...new Set(data.openJobs.map((job) => job.employmentType))
  ];

  $: matching = data.openJobs.filter((job) => {
    const term = query.trim().toLowerCase();
    const place = location.trim().toLowerCase();

    return (
      `${job.title} ${job.department} ${job.description}`
        .toLowerCase()
        .includes(term) &&
      job.location.toLowerCase().includes(place) &&
      (type === 'All types' || job.employmentType === type)
    );
  });

  $: ordered = [...matching].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    return sort === 'oldest'
      ? aTime - bTime
      : bTime - aTime;
  });

  $: current =
    ordered.find((job) => job.id === selected) ?? ordered[0];

  $: hasFilters =
    query.trim() !== '' ||
    location.trim() !== '' ||
    type !== 'All types';

  function selectJob(id: string) {
    selected = id;
    mobileDetails = true;
  }

  function clearFilters() {
    query = '';
    location = '';
    type = 'All types';
    selected = null;
  }

  function toggleSaved(id: string) {
    saved = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];

    try {
      localStorage.setItem(
        'origins-saved-jobs',
        JSON.stringify(saved)
      );
    } catch {
      // Saving locally may be unavailable in private browsing.
    }
  }

  function shortDate(value: Date | string) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  function isNew(value: Date | string) {
    const age = Date.now() - new Date(value).getTime();
    return age >= 0 && age <= 7 * 86400000;
  }

  onMount(() => {
    try {
      const items = JSON.parse(
        localStorage.getItem('origins-saved-jobs') ?? '[]'
      );

      if (Array.isArray(items)) {
        saved = items.filter(
          (item): item is string => typeof item === 'string'
        );
      }
    } catch {
      saved = [];
    }
  });
</script>

<svelte:head>
  <title>Careers & Open Positions | Origins Software</title>
  <meta
    name="description"
    content="Discover career opportunities at Origins Software. Explore our open positions, learn about the company and apply securely through our candidate portal."
  />
</svelte:head>

<div class="careers">

  <!-- CORPORATE HEADER -->
  <header class="career-nav">
    <div class="board-container nav-inner">

      <a href="/" class="career-logo" aria-label="Origins Software Careers">
        <img
          src="/images/origins-logo.png"
          alt=""
          width="42"
          height="42"
        />

        <span class="logo-copy">
          <strong>ORIGINS</strong>
          <small>SOFTWARE <span>/</span> CAREERS</small>
        </span>
      </a>

      <nav class="desktop-nav" aria-label="Main navigation">
        <a href="#jobs">Opportunities</a>
        <a href="#about">About Origins</a>
        <a href="#process">How we hire</a>
        <a
          href="https://www.origins-software.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Company website <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <div class="nav-actions">
        {#if data.signedIn}
          <a class="nav-cta" href="/account">
            My dashboard <span aria-hidden="true">↗</span>
          </a>
        {:else}
          <a class="sign-in" href="/login">Sign in</a>
          <a class="nav-cta" href="/signup">
            Create account <span aria-hidden="true">↗</span>
          </a>
        {/if}
      </div>

    </div>
  </header>

  <main>

    <!-- EDITORIAL INTRO: NO FULL-SCREEN HERO -->
    <section class="career-intro">
      <div class="board-container intro-layout">

        <div class="intro-main">
          <div class="section-index">
            <span class="index-line"></span>
            ORIGINS SOFTWARE / CAREERS
          </div>

          <h1>
            Build meaningful work.
            <span>Find your place.</span>
          </h1>

          <p>
            Discover opportunities at Origins Software.
            Explore available roles, find the right fit for your
            experience, and take your next step with us.
          </p>

          <div class="intro-links">
            <a href="#jobs" class="intro-primary">
              Explore opportunities
              <span aria-hidden="true">↗</span>
            </a>

            <a href="#about" class="intro-secondary">
              Get to know Origins
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div class="intro-aside">
          <span class="aside-label">CURRENTLY RECRUITING</span>

          <div class="aside-count">
            {data.openJobs.length.toString().padStart(2, '0')}
          </div>

          <strong>Open opportunities</strong>

          <div class="aside-bottom">
            <span class="status-dot"></span>
            Browse published positions
          </div>
        </div>

      </div>
    </section>

    <!-- JOB BOARD -->
    <section class="jobs-section" id="jobs">
      <div class="board-container">

        <div class="section-heading">
          <div>
            <span class="section-index">
              <span class="index-line"></span>
              01 / OPEN OPPORTUNITIES
            </span>

            <h2>Explore available positions.</h2>

            <p>
              Search by role, keyword, location or employment type.
            </p>
          </div>

          <div class="positions-count">
            <span class="status-dot"></span>
            <strong>{data.openJobs.length}</strong>
            positions published
          </div>
        </div>

        <!-- SEARCH -->
        <div class="search-shell">

          <label class="search-field keyword-field">
            <span class="field-label">KEYWORD OR ROLE</span>

            <span class="field-control">
              <svg viewBox="0 0 24 24" width="18" height="18"
                fill="none" stroke="currentColor"
                stroke-width="1.8" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="7"></circle>
                <path d="m16 16 5 5"></path>
              </svg>

              <input
                bind:value={query}
                type="search"
                placeholder="Job title, skill or department"
                aria-label="Search job title, skill or department"
              />
            </span>
          </label>

          <label class="search-field location-field">
            <span class="field-label">LOCATION</span>

            <span class="field-control">
              <svg viewBox="0 0 24 24" width="18" height="18"
                fill="none" stroke="currentColor"
                stroke-width="1.8" aria-hidden="true">
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path>
                <circle cx="12" cy="10" r="2.5"></circle>
              </svg>

              <input
                bind:value={location}
                placeholder="City or remote"
                aria-label="Filter jobs by location"
              />
            </span>
          </label>

          <label class="search-field type-field">
            <span class="field-label">EMPLOYMENT</span>

            <select
              bind:value={type}
              aria-label="Filter by employment type"
            >
              <option value="All types">All employment types</option>
              {#each employmentTypes as employmentType}
                <option value={employmentType}>
                  {employmentType}
                </option>
              {/each}
            </select>
          </label>

          <a class="search-action" href="#results">
            View roles <span aria-hidden="true">↗</span>
          </a>

        </div>

        <div class="results-toolbar" id="results">
          <span>
            Showing <strong>{matching.length}</strong>
            of {data.openJobs.length} opportunities
          </span>

          {#if hasFilters}
            <button onclick={clearFilters}>
              Clear filters <span aria-hidden="true">×</span>
            </button>
          {/if}
        </div>

        <div class="job-layout">

          <!-- JOB LIST COLUMN -->
          <div class="jobs-list">

            <div class="list-heading">
              <div>
                <h3>All positions</h3>
                <p>Select a role to view its complete description.</p>
              </div>

              <label class="sort-field">
                <span>Sort by</span>
                <select bind:value={sort} aria-label="Sort positions">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>

            <div class="listing-stack">
              {#each ordered as job (job.id)}
                <article
                  class="listing"
                  class:chosen={current?.id === job.id}
                >
                  <button
                    class="listing-main"
                    onclick={() => selectJob(job.id)}
                    aria-pressed={current?.id === job.id}
                  >
                    <div class="listing-top">
                      <span class="department">{job.department}</span>

                      {#if isNew(job.createdAt)}
                        <span class="new-label">
                          <span class="status-dot"></span>
                          NEW
                        </span>
                      {/if}
                    </div>

                    <h4>{job.title}</h4>

                    <div class="listing-meta">
                      <span>{job.location}</span>
                      <span class="meta-divider">/</span>
                      <span>{job.employmentType}</span>
                    </div>

                    <p class="listing-excerpt">
                      {job.description.slice(0, 145)}
                      {job.description.length > 145 ? '…' : ''}
                    </p>

                    <div class="listing-footer">
                      <span>Posted {shortDate(job.createdAt)}</span>
                      <strong>View position <span>↗</span></strong>
                    </div>
                  </button>

                  <button
                    class="bookmark"
                    class:saved={saved.includes(job.id)}
                    aria-label={saved.includes(job.id)
                      ? `Remove ${job.title} from saved positions`
                      : `Save ${job.title}`}
                    aria-pressed={saved.includes(job.id)}
                    onclick={() => toggleSaved(job.id)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill={saved.includes(job.id)
                        ? 'currentColor'
                        : 'none'}
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 3.5h12v17l-6-4-6 4z"></path>
                    </svg>
                  </button>

                </article>
              {:else}
                <div class="empty-state">
                  <div class="empty-symbol">⌕</div>
                  <h4>No matching positions</h4>
                  <p>
                    Try another keyword or broaden your location
                    and employment filters.
                  </p>
                  <button onclick={clearFilters}>Reset search ↗</button>
                </div>
              {/each}
            </div>

            <p class="saved-note">
              Saved positions are stored on this device.
              Create an account to apply and track applications.
            </p>

          </div>

          <!-- STICKY JOB DETAIL COLUMN -->
          <aside
            class="job-detail"
            class:mobile-open={mobileDetails}
            aria-label="Position details"
          >
            {#if current}
              <div class="detail-topline">
                <span>POSITION OVERVIEW</span>
                <span>ORIGINS SOFTWARE</span>
              </div>

              <button
                class="mobile-back"
                onclick={() => mobileDetails = false}
              >
                ← Back to positions
              </button>

              <div class="detail-heading">
                <span class="department">{current.department}</span>
                <h3>{current.title}</h3>
                <p>Discover the position and review its requirements.</p>
              </div>

              <div class="detail-facts">
                <div>
                  <span>LOCATION</span>
                  <strong>{current.location}</strong>
                </div>

                <div>
                  <span>EMPLOYMENT</span>
                  <strong>{current.employmentType}</strong>
                </div>

                <div>
                  <span>DATE POSTED</span>
                  <strong>{shortDate(current.createdAt)}</strong>
                </div>
              </div>

              <div class="detail-actions">
                <a
                  class="apply-button"
                  href={data.signedIn
                    ? `/account?job=${current.id}`
                    : `/signup?next=${encodeURIComponent(`/account?job=${current.id}`)}`}
                >
                  {data.signedIn
                    ? 'Continue to application'
                    : 'Create account to apply'}
                  <span aria-hidden="true">↗</span>
                </a>

                <button
                  class="detail-save"
                  aria-pressed={saved.includes(current.id)}
                  onclick={() => toggleSaved(current.id)}
                >
                  {saved.includes(current.id)
                    ? '✓ Saved position'
                    : '+ Save position'}
                </button>
              </div>

              <div class="detail-description">
                <h4>About this role</h4>
                <div>{current.description}</div>
              </div>

              <div class="detail-signoff">
                <strong>ORIGINS SOFTWARE</strong>
                <span>BUILD BEYOND BOUNDARIES.</span>
              </div>
            {:else}
              <div class="detail-empty">
                <h3>No position available</h3>
                <p>
                  Select a published opportunity to see more information.
                </p>
              </div>
            {/if}
          </aside>

        </div>
      </div>
    </section>

    <!-- COMPANY INTRODUCTION -->
    <section class="company-section" id="about">
      <div class="board-container company-layout">

        <div class="company-title">
          <span class="section-index">
            <span class="index-line"></span>
            02 / ABOUT OUR COMPANY
          </span>

          <h2>
            Get to know
            <span>Origins Software.</span>
          </h2>
        </div>

        <div class="company-content">
          <p class="company-lead">
            We build software and digital solutions with a focus
            on thoughtful engineering and meaningful outcomes.
          </p>

          <p>
            Our Careers portal connects people with available
            opportunities at Origins Software. Explore our published
            positions, understand what each role involves, and learn
            more about the company through our corporate website.
          </p>

          <a
            class="company-link"
            href="https://www.origins-software.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <small>EXPLORE THE COMPANY</small>
              <strong>Visit our corporate website</strong>
              <em>www.origins-software.com</em>
            </span>

            <span class="company-link-icon" aria-hidden="true">↗</span>
          </a>
        </div>

      </div>
    </section>

    <!-- SIMPLE PROCESS -->
    <section class="process-section" id="process">
      <div class="board-container">

        <div class="process-heading">
          <div>
            <span class="section-index">
              <span class="index-line"></span>
              03 / RECRUITMENT PROCESS
            </span>

            <h2>A straightforward way to apply.</h2>
            <p>
              From discovering a position to tracking your application.
            </p>
          </div>
        </div>

        <div class="process-grid">
          <article>
            <span class="step-number">01</span>
            <h3>Explore a position</h3>
            <p>
              Search current openings and review the full job description.
            </p>
          </article>

          <article>
            <span class="step-number">02</span>
            <h3>Create your profile</h3>
            <p>
              Register with your email and prepare your candidate profile.
            </p>
          </article>

          <article>
            <span class="step-number">03</span>
            <h3>Apply and track</h3>
            <p>
              Submit your application and follow its status securely.
            </p>
          </article>
        </div>

      </div>
    </section>

  </main>

  <footer class="career-footer">
    <div class="board-container footer-inner">
      <div class="footer-identity">
        <img
          src="/images/origins-logo.png"
          width="34"
          height="34"
          alt=""
        />
        <div>
          <strong>ORIGINS SOFTWARE</strong>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </div>

      <nav aria-label="Footer navigation">
        <a href="https://www.origins-software.com/">Company</a>
        <a href="https://www.origins-software.com/privacy">Privacy</a>
        <a href="https://www.origins-software.com/terms">Terms</a>
        <a href="/login">Candidate sign in</a>
      </nav>
    </div>
  </footer>

</div>
