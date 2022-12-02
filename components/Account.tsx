import { useState, useEffect } from "react"
import {
  useUser,
  useSupabaseClient,
  Session
} from "@supabase/auth-helpers-react"
import { Database } from "../utils/database"
type Profiles = Database["public"]["Tables"]["profiles"]["Row"]
import Avatar from "./Avatar"

export default function Account({ session }: { session: Session }) {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<Profiles["username"]>(null)
  const [website, setWebsite] = useState<Profiles["website"]>(null)
  const [avatar_url, setAvatarUrl] = useState<Profiles["avatar_url"]>(null)
  const [fullName, setFullName] = useState<Profiles["full_name"]>(undefined)

  useEffect(() => {
    getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!user) throw new Error("No user")

      let { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url, full_name`)
        .eq("id", user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setFullName(data.full_name)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert("Error loading user data!")
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
    full_name
  }: {
    username: Profiles["username"]
    website: Profiles["website"]
    avatar_url: Profiles["avatar_url"]
    full_name: Profiles["full_name"]
  }) {
    try {
      setLoading(true)
      if (!user) throw new Error("No user")

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url,
        full_name,
        updated_at: new Date().toISOString()
      }

      let { error } = await supabase.from("profiles").upsert(updates)
      if (error) throw error
      alert("Profile updated!")
    } catch (error) {
      alert("Error updating the data!")
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-widget">
      <Avatar
        uid={user!.id}
        url={avatar_url}
        size={150}
        onUpload={url => {
          setAvatarUrl(url)
          updateProfile({
            username,
            website,
            avatar_url: url,
            full_name: fullName
          })
        }}
      />
      <div>
        <label htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={session.user.email} disabled />
      </div>

      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username || ""}
          onChange={e => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="website"
          value={website || ""}
          onChange={e => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <button
          className="button primary block"
          onClick={() =>
            updateProfile({
              username,
              website,
              avatar_url,
              full_name: fullName
            })
          }
          disabled={loading}
        >
          {loading ? "Loading ..." : "Update"}
        </button>
      </div>

      <div>
        <button
          className="button block"
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
