<script lang="ts">
  import { useQuery, useMutation } from 'convex-svelte';
  import { api } from '$convex/_generated/api';
  import { SignedIn, SignedOut, SignInButton } from 'svelte-clerk';

  // Reactive real-time subscription to authenticated query
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
  <div class="hero-card">
    <h1>Welcome to Full-Stack SvelteKit</h1>
    <p>
      This app demonstrates real-time reactive data with <strong>Convex</strong>, secure authentication
      powered by <strong>Clerk</strong>, and code quality verified by <strong>Biome</strong>.
    </p>
    <SignInButton mode="modal" class="btn-cta">Get Started & Sign In</SignInButton>
  </div>
</SignedOut>

<SignedIn>
  <section class="dashboard">
    <h2>Your Real-Time Tasks</h2>
    <p class="subtitle">Data updates instantly across all connected clients.</p>

    <form onsubmit={handleSubmit} class="task-form">
      <input
        type="text"
        bind:value={newTaskText}
        placeholder="What do you need to do?"
        disabled={isSubmitting}
        class="task-input"
      />
      <button type="submit" disabled={isSubmitting || !newTaskText.trim()} class="btn-submit">
        {isSubmitting ? 'Adding...' : 'Add Task'}
      </button>
    </form>

    {#if $tasks.isLoading}
      <div class="state-card loading">
        <p>Loading real-time tasks from Convex...</p>
      </div>
    {:else if $tasks.error}
      <div class="state-card error">
        <p>Failed to load tasks: {$tasks.error.toString()}</p>
      </div>
    {:else if $tasks.data?.length === 0}
      <div class="state-card empty">
        <p>No tasks found. Add your first task using the form above!</p>
      </div>
    {:else}
      <ul class="task-list">
        {#each $tasks.data ?? [] as task (task._id)}
          <li class="task-item">
            <label class="task-label">
              <input
                type="checkbox"
                checked={task.isCompleted}
                onchange={() => toggleTask({ id: task._id })}
                class="task-checkbox"
              />
              <span class="task-text" class:completed={task.isCompleted}>
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
    background: #ffffff;
    padding: 3rem 2rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 600px;
    margin: 3rem auto;
  }

  .hero-card h1 {
    margin-top: 0;
    color: #111827;
  }

  .hero-card p {
    color: #4b5563;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  :global(.btn-cta) {
    background-color: #2563eb;
    color: #ffffff;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .dashboard {
    background: #ffffff;
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .dashboard h2 {
    margin: 0 0 0.25rem 0;
    color: #111827;
  }

  .subtitle {
    margin: 0 0 1.5rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .task-form {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .task-input {
    flex: 1;
    padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.95rem;
  }

  .task-input:focus {
    outline: 2px solid #2563eb;
    outline-offset: -1px;
    border-color: transparent;
  }

  .btn-submit {
    padding: 0.625rem 1.25rem;
    background: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .state-card {
    padding: 1.5rem;
    text-align: center;
    border-radius: 0.375rem;
    background: #f3f4f6;
    color: #4b5563;
  }

  .state-card.error {
    background: #fee2e2;
    color: #991b1b;
  }

  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .task-item {
    padding: 0.875rem 0.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .task-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  .task-checkbox {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: #2563eb;
  }

  .task-text {
    font-size: 1rem;
    color: #1f2937;
  }

  .task-text.completed {
    text-decoration: line-through;
    color: #9ca3af;
  }
</style>
