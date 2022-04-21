<script>
    import { useTracker } from "meteor/rdb:svelte-meteor-data";
    import { Issues } from "../api/issues.js";
    import { Meteor } from "meteor/meteor";
    import LoginForm from "./LoginForm.svelte";
    import Nav from "./Nav.svelte";
    import Issue from "./Issue.svelte";
    import { onMount } from "svelte";

    let user = null;

    $m: {
        user = Meteor.user();
    }

    $: issues = useTracker(() =>
        Issues.find({}, { sort: { createdAt: -1 } }).fetch()
    );

    let errorMsg = "";

    let newIssue = {
        title: "",
        description: "",
        priority: "Low",
        dueDate: "",
    };

    function handleSubmit(event) {
        if (!newIssue.title) {
            errorMsg = "Title is required";
            return;
        }

        if (!newIssue.description) {
            errorMsg = "Description is required";
            return;
        }

        if (!newIssue.dueDate) {
            errorMsg = "Due date is required";
            return;
        }

        if (new Date(newIssue.dueDate).valueOf() < new Date().valueOf()) {
            errorMsg = "Due date must be in the future";
            return;
        }

        Issues.insert({
            title: newIssue.title,
            description: newIssue.description,
            priority: newIssue.priority,
            dueDate: newIssue.dueDate,
            userId: user._id,
            createdAt: new Date(),
        });

        newIssue = {
            title: "",
            description: "",
            priority: "Low",
            dueDate: "",
        };
    }
    function yyyymmdd() {
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth() + 1;
        var d = now.getDate();
        var mm = m < 10 ? "0" + m : m;
        var dd = d < 10 ? "0" + d : d;
        return "" + y + "-" + mm + "-" + dd;
    }
</script>

<div>
    {#if user}
        <Nav />
        <div class="main-content">
            <header>
                <h1>Issues</h1>
                <form on:submit|preventDefault={handleSubmit}>
                    <div class="floating-label-wrap">
                        <input
                            type="text"
                            id="title"
                            class="floating-label-field"
                            autocorrect="off"
                            autocomplete="off"
                            spellcheck="false"
                            placeholder="Title"
                            bind:value={newIssue.title}
                        />
                        <label for="title" class="floating-label">Title</label>
                    </div>
                    <br />
                    <div class="floating-label-wrap">
                        <textarea
                            id="description"
                            class="floating-label-field"
                            placeholder="Description"
                            rows="10"
                            bind:value={newIssue.description}
                        />
                        <label for="title" class="floating-label"
                            >Description</label
                        >
                    </div>
                    <br/>
                    <div>
                        <input
                            id="duedate"
                            type="date"
                            bind:value={newIssue.dueDate}
                        />
                    </div>
                    <br/>
                    <label for="priority">Priority:</label>
                    <select id="priority" bind:value={newIssue.priority}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                    <p>{errorMsg}</p>
                    <input type="submit" value="Create Issue" />
                </form>
            </header>
            <main>
                {#each $issues as issue}
                    <Issue {issue} />
                {/each}
            </main>
        </div>
    {:else}
        <div class="main-content">
            <LoginForm />
        </div>
    {/if}
</div>
