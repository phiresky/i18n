# hediet-i18n

Main problems of other i18n solutions are:

1. Translatable texts that are not used anymore in the code base cannot easily be detected as stale. Translators don't know what needs to be translated and what not - so they have to translate everything, including unused texts.
2. New translatable texts cannot be identified quickly. They have to be collected during runtime. This makes it very hard to guarantee that everything has been translated before a release.
3. When changing the English default text of a translatable message, the key gets out of sync. (T`Our company does not support foo` could actually mean `Our company supports foo`, because the content is used as key. The key cannot be changed easily.)
4. Translatable texts cannot be extracted statically.

Basically, problems 1 and 2 can be fixed with a solution for 4:
If all translatable texts can be extracted from the source code, unused translations can be detected and removed automatically.
Also, new translatable texts can be identified in the CI pipeline. Tooling could ensure that all texts are translated before a release.

Problem 3 can be fixed by using explicit keys, preferrable random keys to avoid any desync issues.

To improve the i18n situation of our project, we implement the following system.

# Examples

## T

### Old (i18next)

```ts
T`The next rain will be in ${{ minutes }} minutes. It currently has ${{
	amount: info.current_amount,
}} mm.`;
```

-   Pros:
    -   Short
    -   Intuitive
-   Cons:
    -   Unclear how pluralization / he/her / number formatting etc. is handled.
    -   Not robust to text changes

### New

```ts
TransText(
	"The next rain will be in {minutes} minutes. It currently has {amount} mm.",
	{
		data: { minutes, amount: info.current_amount },
		id: "a9awvKD9r",
	},
);
```

-   Pros:
    -   Id has no context and does not need to be ever changed.
        With it, text changes can be easily synchronized from/to a central location.
    -   The default text has the same syntax as the translator would use. This makes it even easier to synchronize the default english text back and forth.
    -   This fixes problem 3 and 4 and thus also problems 1 and 2.
-   Cons:
    -   More verbose
    -   Needs tooling to generate a random unique id (will be implemented for VS Code)

Robustness for tooling is very important to implement a i18n solution, so the pros outweigh the cons in my opinion.

As format language, we use the `MultilineString` production of the [geml](https://github.com/hediet/geml) language.
The default property of `TransText` uses this format language, as well as all translators.

You can find a comparison and some more examples of `geml` [here](./custom-syntax-notes.md).

NOTE: In the current implementations, the pros of geml are minor. It is probably worth it to move back to a simple XML subset for easier onboarding and compatiblity with automated AI translation systems.

## Trans

### Old (i18next)

```tsx
<Trans>Spinning in</Trans>
```

### New

```tsx
<TransMsg default="Spinning in" id="Hhk6Qv5Up" />
```

Basically the same arguments apply here.

### Old

```tsx
<Trans>
	Find your Profile URL{" "}
	<PrivateLink className="info" href="https://example.com/privacy">
		here
	</PrivateLink>
</Trans>
```

### New

```tsx
<TransMsg
	default="Find your Profile URL {link <here>}"
	data={{
		link: (text) => (
			<PrivateLink className=" info" href="https://example.com/privacy">
				{text}
			</PrivateLink>
		),
	}}
	id="6f6821e4"
/>
```

### Old

```tsx
<Trans>
	As you probably know by now, we are always looking to cater to our community
	with most in-demand games in the industry. In the early ages, it was our
	priority to introduce both{" "}
	<NavLink to="/poker" className="clickableLink">
		<Trans>Poker</Trans>
	</NavLink>{" "}
	and{" "}
	<NavLink to="/chat" className="clickableLink">
		<Trans>Chat</Trans>
	</NavLink>{" "}
	as our first features.
</Trans>
```

### New

```tsx
<TransMsg
	default="As you probably know by now, we are always looking to cater to our community with most in-demand games in the industry. In the early ages, it was our priority to introduce both {pokerLink <Poker>} and {chatLink <Chat>} as our features."
	data={{
		pokerLink: (text) => (
			<NavLink to="/poker" className="clickableLink">
				{text}
			</NavLink>
		),
		chatLink: (text) => (
			<NavLink to="/chat" className="clickableLink">
				{text}
			</NavLink>
		),
	}}
	id="6f5321e4"
/>
```

By not mixing react components with the text to translate,
it is much easier to implement robust tooling that extracts translatable texts.
This makes it even possible to synchronize updates of the default locale back to the source, which is close to impossible with the old approach where react elements are mixed with the text.
It is a little bit more work, but the gain is worth it.

## Ideas

-   Lints (done - eslint auto fix to generate id)
-   Code Snippet (not important)
-   Live Translation Editor (done)
-   Syntax Highlighting
-   Automatic Extraction
-   Id generator in VS Code (done)
