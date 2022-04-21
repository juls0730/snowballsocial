<script>
    import { Meteor } from "meteor/meteor";

    let username = "";
    let password = "";

    const handleSubmit = () => {
        Meteor.loginWithPassword(username, password);
    };
</script>

<form class="login-form" on:submit|preventDefault={handleSubmit}>
    <div class="floating-label-wrap">
        <input
            type="text"
            placeholder="Username"
            class="floating-label-field"
            name="username"
            required
            bind:value={username}
        />
        <label for="title" class="floating-label">Username</label>
    </div>
    <br/>
    <div class="floating-label-wrap">
        <input
            type="password"
            placeholder="Password"
            class="floating-label-field"
            name="password"
            required
            bind:value={password}
        />
        <label for="title" class="floating-label">Password</label>
    </div>
    <div>
        <button type="submit">Log In</button>
    </div>
</form>
