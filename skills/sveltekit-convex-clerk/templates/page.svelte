<script lang="ts">
  import { useQuery, useMutation } from 'convex-svelte';
  import { api } from '$convex/_generated/api';
  import { SignedIn, SignedOut, SignInButton } from 'svelte-clerk';

  const tasks = useQuery(api.tasks.list, {});
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);

  let newTaskText = $state('');
  let isSubmitting = $state(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const text = newTaskText.trim();
    if (!text || isSubmitting) return;

    isSubmitting = true;
    try {
      await createTask({ text });
      newTaskText = '';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<SignedOut>
  <div class="card hero-card">
    <h1>Welcome to Your App</h1>
    <p>Sign in to start creating and saving your items in real time.</p>
    <SignInButton mode="modal" class="btn btn-primary">Sign In to Get Started</SignInButton>
  </div>
</SignedOut>

<SignedIn>
  <section class="card">
    <div class="card-header">
      <h2>Your Saved Items</h2>
      <span class="badge">Live Sync</span>
    </div>
    <p class="card-subtitle">Anything you add updates instantly across your phone and computer.</p>

    <form onsubmit={handleSubmit} class="add-form">
      <input
        type="text"
        bind:value={newTaskText}
        placeholder="Add a new item..."
        disabled={isSubmitting}
        class="input"
      />
      <button type="submit" disabled={isSubmitting || !newTaskText.trim()} class="btn btn-primary">
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>

    {#if $tasks.isLoading}
      <div class="state-message">
        <p>Loading your items...</p>
      </div>
    {:else if $tasks.error}
      <div class="state-message error">
        <p>Could not load items: {$tasks.error.toString()}</p>
      </div>
    {:else if $tasks.data?.length === 0}
      <div class="state-message">
        <p>No items yet. Type something above and click Add!</p>
      </div>
    {:else}
      <ul class="item-list">
        {#each $tasks.data ?? [] as task (task._id)}
          <li class="item-row">
            <label class="item-label">
              <input
                type="checkbox"
                checked={task.isCompleted}
                onchange={() => toggleTask({ id: task._id })}
                class="checkbox"
              />
              <span class="item-title" class:completed={task.isCompleted}>
                {task.text}
              </span>
            </label>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</SignedIn>

<style>
  .hero-card {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .hero-card h1 {
    margin-top: 0;
    font-size: 2rem;
  }

  .hero-card p {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .card-header h2 {
    margin: 0;
  }

  .card-subtitle {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .add-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .item-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .item-row {
    padding: 0.875rem 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .item-row:last-child {
    border-bottom: none;
  }

  .item-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  .checkbox {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: var(--color-primary);
  }

  .item-title {
    font-size: 1rem;
    color: var(--color-text);
  }

  .completed {
    text-decoration: line-through;
    color: var(--color-text-muted);
  }

  .state-message {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-muted);
    background: var(--color-bg);
    border-radius: var(--radius-md);
  }

  .state-message.error {
    color: var(--color-error);
    background: var(--color-error-bg);
  }
</style>
