import {Button, Flex, Spinner} from "@chakra-ui/react"
import useShowToast from "../hooks/useShowToast";
import { useEffect,useState } from "react";
import Post from "../components/Post.jsx";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom.js";

const HomePage = () => {
  const [posts,setPosts] = useRecoilState(postsAtom)
  const [loading,setLoading] = useState(true);
  const showToast = useShowToast();

  useEffect(()=>{
    const getFeedPosts = async()=>{
      setLoading(true);
      setPosts([]);
      try{
        const res = await fetch("/api/posts/feed");
        const data = await res.json();
        console.log(data);
        if(data.error){
          showToast("Error",data.error,"error");
        }
        setPosts(data)
      }catch(error){
        showToast("Error",error,"error");
      }finally{
        setLoading(false);
      }
    }

    getFeedPosts();
  },[showToast, setPosts])

  return (
    <>
      {!loading && posts.length===0 && <h1>Follow some users to see the feed</h1>}

      {loading && (
        <Flex justify={"center"}>
          <Spinner size="xl"/>
        </Flex>
      )}

      {posts.map((post) => (
        <Post key={post._id} post={post} postedBy = {post.postedBy}/>
      ))}

    </>
  )
}

export default HomePage
