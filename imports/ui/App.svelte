<script>
    import { BlazeTemplate } from 'meteor/svelte:blaze-integration';
    import { useTracker } from "meteor/rdb:svelte-meteor-data";
    import { Issues } from "../api/issues.js";
    import Issue from "./Issue.svelte";

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
        if(!newIssue.title) {
            errorMsg = "Title is required";
            return;
        }

        if(!newIssue.description) {
            errorMsg = "Description is required";
            return;
        }

        if(!newIssue.dueDate) {
            errorMsg = "Due date is required";
            return;
        }

        if(new Date(newIssue.dueDate).valueOf() < new Date().valueOf()) {
            errorMsg = "Due date must be in the future";
            return;
        }

        Issues.insert({
            title: newIssue.title,
            description: newIssue.description,
            priority: newIssue.priority,
            dueDate: newIssue.dueDate,
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
    <header>
        <h1>Issues</h1>

        <BlazeTemplate template="loginButtons" />
        
        <form on:submit|preventDefault={handleSubmit}>
            <input
                type="text"
                id="title"
                placeholder="Title..."
                bind:value={newIssue.title}
            /><br />
            <textarea
                id="description"
                placeholder="Description..."
                bind:value={newIssue.description}
            /><br />
            <input id="duedate" type="date" bind:value={newIssue.dueDate} /><br
            />
            <label for="priority">Priority:</label>
            <select id="priority" bind:value={newIssue.priority}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select><br />
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
